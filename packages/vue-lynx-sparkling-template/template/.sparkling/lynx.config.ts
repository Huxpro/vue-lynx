import cfgModule from '../app.config.ts'
const cfg: any = (cfgModule as any).default ?? cfgModule
export default (cfg.lynxConfig ?? cfg) as any