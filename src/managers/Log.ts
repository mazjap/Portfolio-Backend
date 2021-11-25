import { createWriteStream, WriteStream } from "fs"

export default class Log {
    private filename: string
    private writeStream: WriteStream

    constructor(filename: string = "log.txt") {
        this.filename = filename
        this.writeStream = createWriteStream(filename, { flags: "a" })
    }

    log(...strings) {
        for (const str of strings) {
            const message = Log.currentTimestamp() + ": " + str + "\n"
            console.log(str)

            this.writeStream.write(message, error => {
                if (error) {
                    console.log("Incountered error while writing the message '" + str + "' to " + this.filename)
                }
            })
        }
    }

    static currentTimestamp(): string {
        const now = new Date()
  
        const date =
            ((now.getDate() < 10) ? "0" : "") +
            now.getDate() +
            "/" +
            (((now.getMonth() + 1) < 10) ? "0" : "") +
            (now.getMonth() + 1) +
            "/" +
            now.getFullYear()
        
        const time =
            ((now.getHours() < 10) ? "0" : "") +
            ((now.getHours() > 12) ? (now.getHours() - 12) : now.getHours()) +
            ":" +
            ((now.getMinutes() < 10) ? "0" : "") +
            now.getMinutes() +
            ":" +
            ((now.getSeconds() < 10) ? "0" : "") +
            now.getSeconds() +
            ((now.getHours() > 12) ? "PM" : "AM")
    
        return date + " " + time
    }
}