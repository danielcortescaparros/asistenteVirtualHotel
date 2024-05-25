import { addKeyword, EVENTS } from "@builderbot/bot";
import { clearHistory } from "../utils/handleHistory";
import { addMinutes, format } from "date-fns";
import { utcToZonedTime } from "date-fns-tz";
import { appToCalendar } from "src/services/calendar";
import { PrismaClient } from "@prisma/client";

//db
const prisma = new PrismaClient;

const DURATION_MEET = process.env.DURATION_MEET ?? 45
const TIME_ZONE = process.env.TZ

// Flow
const flowConfirm = addKeyword(EVENTS.ACTION).addAction(async (_, { flowDynamic }) => {
    await flowDynamic('Perfecto, ya casi está, para enviar la solicitud responda a lo siguiente por favor.')
    await flowDynamic('¿Cuál es su número de habitación?')
}).addAction({ capture: true }, async (ctx, { state, flowDynamic, endFlow, fallBack }) => {

    if (ctx.body.toLocaleLowerCase().includes('cancelar')) {
        clearHistory(state)
        return endFlow(`Petición cancelada. ¿Cómo puedo ayudarle?`)
    } else if (!/^\d+$/.test(ctx.body)) {
        return fallBack(`El formato parece ser incorrecto. Por favor, escriba el número de habitación únicamente con números.`)
    }
    await state.update({ hab: ctx.body })
    await flowDynamic(`Por último, ¿Cómo se llama?`)
})
    .addAction({ capture: true }, async (ctx, { state, flowDynamic, endFlow }) => {

        await state.update({ name: ctx.body })

        // VALIDACIÓN  
        /* if (!ctx.body.includes('@')) {
            return fallBack(`Debes ingresar un mail correcto`)
        } */

        //MANDAR AQUÍ SOLICITUD PHP O SQL -------------------------------------------------------------------

        await prisma.requests.create({
            data: {
                tarea: state.get("tarea"),
                notas: state.get("name"),
                hab: parseInt(state.get("hab"))
            }
        })

        // ---------------------------------------------------------------------------------------------------------

        // Sigue...
        clearHistory(state)
        await flowDynamic('El personal ya ha recibido el aviso y están trabajando en ello')
        await flowDynamic('Para cualquier otra incidencia cuente conmigo')
        await flowDynamic('Le deseo un feliz día')
        return endFlow();
    })

export { flowConfirm }