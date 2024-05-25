import { addKeyword, EVENTS } from "@builderbot/bot";
import { getHistory, getHistoryParse, handleHistory } from "../utils/handleHistory";
import AIClass from "../services/ai";
import { getFullCurrentDate } from "src/utils/currentDate";
import { pdfQuery } from "src/services/pdf";
import { json } from "stream/consumers";
import { generateTimer } from "../utils/generateTimer";
//Flows
import { flowConfirm } from "./confirm.flow";

const PROMPT_CTA = `
### DÍA ACTUAL
{CURRENT_DAY}

### HISTORIAL DE CONVERSACIÓN (Cliente/Asistente)
{HISTORY}

### BASE DE DATOS
{DATABASE}

### LÍNEA DE CONTACTO PARA CLIENTES para información sensible o reservas
Email: clients@nautra.com
TEL:  +34 654654654

Tu único objetivo es analizar la necesidad del cliente basado en el ### HISTORIAL DE CONVERSACIÓN para redactar un aviso/notificación que llegará al personal de la recepción del hotel, que se encargará de solucionar el problema del cliente.

No proporcionas información dinámica (Dependientes del cliente, reserva, etc.) ni datos sensibles. Si el cliente pregunta por ello, proporcionas el contacto de la línea de atención para clientes con su horario.

### Normas ESTRICTAS para tu aviso/notificación:
•   Tienes prohibido decir “el cliente informa”, “el cliente…”. Evita a toda costa mencionar al cliente
•   Tienes prohibidas las palabras: "reportar", "informar", "notificar"
•   ¡¡IMPORTANTE!! Ten en cuenta el ### HISTORIAL DE CONVERSACIÓN para dar tu respuesta
•   No saludes ni des las gracias
•   Respuestas súper claras y directas. Evitar el uso de jerga o redundancia. Respuestas cortas.
•   NO escribas ningún comentario sobre cómo solventar el problema. Únicamente notifícalo. 
•   Prohibido añadir cualquier comentario u opinión ajeno a la descripción del problema.


!! INSTRUCCIONES PARA DAR TU RESPUESTA:
Si el cliente desea contratar un servicio contenido dentro de ### BASE DE DATOS, retornas la notificación a recepción conteniendo el nombre exacto del servicio como se muestra en ### BASE DE DATOS y demás detalles como hora, notas, datos adicionales:

Ejemplo Respuesta Nefasta: Se ha roto un jarrón. Por favor, atender esta situación lo antes posible.
Ejemplo Respuesta Perfecta: Se ha roto un jarrón

Asegúrate de que tu aviso/notificación cumple con las normas
`


export const generatePromptInformation = (history: string, database: string) => {
    const nowDate = getFullCurrentDate()
    return PROMPT_CTA
        .replace('{HISTORY}', history)
        .replace('{CURRENT_DAY}', nowDate)
        .replace('{DATABASE}', database)
};

const ctaFlow = addKeyword(EVENTS.ACTION)

    .addAnswer(`🚀`)

    .addAction(async (_, { state, extensions, flowDynamic }) => {
        try {

            console.log("++++++ INICIO ++++++");

            const ai = extensions.ai as AIClass
            const lastMessage = getHistory(state).at(-1)
            const history = getHistoryParse(state)

            const dataBase = await pdfQuery(lastMessage.content)
            const promptInfo = generatePromptInformation(history, dataBase)

            console.log( {promptInfo} );

            const response = await ai.createChat([
                {
                    role: 'system',
                    content: promptInfo
                } 
            ])
            
            console.log( {response} );

            await state.update({tarea: response});

            console.log(state.get('tarea'));
            
            const message = `Voy a comunicar el siguiente aviso a recepción: ${state.get('tarea')}`;
            await flowDynamic([{ body: message, delay: generateTimer(150, 250) }]);
            await flowDynamic([{ body: `Para confirmar responda "sí", de lo contrario "cancelar"`, delay: generateTimer(150, 250) }]);
            const actMessage = message.concat(` Para confirmar responda "sí", de lo contrario "cancelar"`);
            await handleHistory({ content: actMessage, role: 'assistant' }, state);

        } catch (err) {
            console.log(`[ERROR]:`, err)
            return
        }
    })

    .addAction({ capture: true }, async ({ body }, { gotoFlow, flowDynamic, state }) => {

        if (/s[ií]/i.test(body.toLowerCase())) {
            //await handleHistory({ content: body, role: 'customer' }, state);
            return gotoFlow(flowConfirm);
        } else if (body.toLowerCase().includes('cancelar')) {
            //await handleHistory({ content: body, role: 'customer' }, state);
            await flowDynamic([{ body: "Aviso cancelado", delay: generateTimer(150, 250) }]);
            await flowDynamic([{ body: "¿Necesita cualquier otra cosa?", delay: generateTimer(150, 250) }]);
            await handleHistory({ content: "Aviso cancelado. ¿Necesita cualquier otra cosa?", role: 'assistant' }, state);
            return
        }
        // "else"
        // ...
    })

    .addAnswer(`🔥`)

export { ctaFlow }