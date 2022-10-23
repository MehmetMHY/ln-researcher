module.exports = class colors {

    // https://stackoverflow.com/questions/9781218/how-to-change-node-jss-console-font-color
    colorValues = {
        general: {
            bright: "\x1b[1m",
            dim: "\x1b[2m",
            underscore: "\x1b[4m",
            blink: "\x1b[5m",
            reverse: "\x1b[7m",
            hidden: "\x1b[8m",
            reset: "\x1b[0m"
        },
        text: {
            black: "\x1b[30m",
            red: "\x1b[31m",
            green: "\x1b[32m",
            yellow: "\x1b[33m",
            blue: "\x1b[34m",
            magenta: "\x1b[35m",
            cyan: "\x1b[36m",
            white: "\x1b[37m",
            reset: "\x1b[0m"
        },
        background: {
            black: "\x1b[40m",
            red: "\x1b[41m",
            green: "\x1b[42m",
            yellow: "\x1b[43m",
            blue: "\x1b[44m",
            magenta: "\x1b[45m",
            cyan: "\x1b[46m",
            white: "\x1b[47m",
            reset: "\x1b[0m"
        }
    }

    constructor(){}

    values(options=undefined){
        switch ( options ) {
            case "general":
                return this.colorValues.general
            case "text":
                return this.colorValues.text
            case "background":
                return this.colorValues.background
            default:
                return this.colorValues
        }
    }

    highlight(type, color, msg){
        return `${this.colorValues[type][color]}${msg}${this.colorValues[type]["reset"]}`
    }
}