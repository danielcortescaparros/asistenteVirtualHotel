import { BotContext, BotMethods } from "@builderbot/bot/dist/types"
import { getHistoryParse } from "../utils/handleHistory"
import AIClass from "../services/ai"
import { infoFlow } from "../flows/info.flow"
import { ctaFlow } from "src/flows/cta.flow"
import { flowSchedule } from "../flows/schedule.flow"

const PROMPT_DISCRIMINATOR = `
### Historial de Conversación (Vendedor/Cliente) ###
{HISTORY}

**INFORMACION**: Selecciona esta acción si el cliente parece necesitar más INFORMACIÓN sobre el hotel, sus servicios o informarse del horario de atención.
**CTA**: Selecciona esta acción si el cliente quiere dar un aviso, si le ha ocurrido cualquier cosa que requiera la acción de un humano como: Necesita una toalla, almohada extra, suministros para la habitación (Una persona tiene que llevársela), se le rompe un jarrón (Tiene que ir el servicio de limpieza). Piensa en posibles soluciones a los problemas que te plantee el cliente, si la solución de un humano puede resolverlo, selecciona esta opción. O si el cliente QUIERE CONTRATAR un servicio.

### Instrucciones ###

Por favor, analiza ### Historial de Conversación y determina la intención del cliente.
`

export default async (_: BotContext, { state, gotoFlow, extensions }: BotMethods) => {
    const ai = extensions.ai as AIClass
    const history = getHistoryParse(state)
    const prompt = PROMPT_DISCRIMINATOR.replace('{HISTORY}', history)


    console.log(prompt)

    const { prediction } = await ai.determineChatFn([
        {
            role: 'system',
            content: prompt
        }
    ])


    console.log({ prediction })

    if (prediction.includes('INFORMACION')) return gotoFlow(infoFlow)
    if (prediction.includes('CTA')) return gotoFlow(ctaFlow)
}