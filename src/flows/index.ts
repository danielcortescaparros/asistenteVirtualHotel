import { createFlow } from "@builderbot/bot";

import { welcomeFlow } from "./welcome.flow";
import { infoFlow } from "./info.flow";
import { flowSchedule } from "./schedule.flow";
import { flowConfirm } from "./confirm.flow";
import { voiceFlow } from "./voice.flow";
import { registerFlow } from "./register.flow";


export default createFlow([
    welcomeFlow,
    infoFlow,
    flowSchedule,
    flowConfirm,
    voiceFlow,
    registerFlow
])