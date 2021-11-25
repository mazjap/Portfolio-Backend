import Log from "./Log"
import Database from "./Database"
import { Express } from "express" // wtf?
import * as express from "express"
import * as crypto from "crypto"
import Project from "../entity/Project"
import AccessType from "./AccessType"

export default class Server {
    private server: Express
    private db: Database
    private c: Log
    private port: string | number

    constructor(log: Log) {
        this.c = log
        this.server = express()
        this.db = new Database(log, error => {
            if (error) {
                this.c.log(error)
            } else {
                this.setupServer()
            }
        })
    }

    private isEqualToHash(toHash) {
        return crypto
            .createHash("sha256")
            .update(toHash)
            .digest("hex")
            == Server.hash
    }

    private setupServer() {
        this.c.log("Setting up server...")
        
        this.port = process.env.PORT ?? 3001

        this.middleware()

        this.server.listen(this.port, () => {
            this.c.log("Server started on port " + this.port)
        })

        this.projectEndpoints()
        this.timelineEndpoints()
    }

    private middleware() {
        this.server.use(express.json())
        this.server.use(express.urlencoded({ extended: true }))

        // Custom middleware
        this.server.use(function(_, res, next) {
            res.setHeader("Access-Control-Allow-Origin", "*")
            res.setHeader("Access-Control-Allow-Methods", "GET, POST")
            res.setHeader("Access-Control-Allow-Headers", "Content-Type")
            res.setHeader("Access-Control-Allow-Headers", "X-Requested-With,content-type, Authorization")

            next()
        })
    }

    private logActionAttempt(action: AccessType, type: string) {
        let actionText = AccessType[action]

        this.c.log(`${actionText} received for type ${type} on server`)
    }

    private formattedProject(project: Project): Object {
        return {
            ...project,
            images: project.images.map(image => image.url),
            video: project.video?.url
        }
    }

    private formattedDate(dateString: string, isRequired: boolean = false): Date {
        const dateInit = new Date(dateString)
        const parseInit = Date.parse(dateString)
        const num = Number(dateString)

        if (!isNaN(dateInit.getTime())) {
            return dateInit
        } else if (!isNaN(parseInit)) {
            return new Date(parseInit)
        } else if (!isNaN(num)) {
            return new Date(num)
        }

        if (isRequired) {
            return new Date(Date.now())
        }

        return null
    }

    private projectEndpoints() {
        // Read
        this.server.get(
            "/projects", 
            (req, res) => {
                this.logActionAttempt(AccessType.GET, "All Projects")

                // Outer Query
                this.db.allProjects()
                    .then(projects => {
                        res.send(projects.map(project => this.formattedProject(project)))
                    })
                    .catch(error => {
                        this.c.log(error)
                        res.send("Unable to get projects")
                    })
            }
        )

        // Read single project
        this.server.get(
            "/projects/:id", 
            (req, res) => {
                this.logActionAttempt(AccessType.GET, "Project")

                const { id } = req.params
                const numId = Number(id)

                if (isNaN(numId)) {
                    res.send("id must be a number")
                    return
                }

                this.db.getProject(numId)
                    .then(project => {
                        res.send(this.formattedProject(project))
                    })
                    .catch(error => {
                        this.c.log(error)
                        res.send("Unable to get project with id: " + id)
                    })
            }
        )

        // Create
        this.server.post("/projects/newEntry", (req, res) => {
            this.logActionAttempt(AccessType.POST, "Project")
            const { token, name, description, techStack, languages, github, type } = req.body
            const images: string[] = req.body.images ?? []
            const video: string | undefined | null = req.body.video
            const production: string = req.body.production
            
            if (!this.isEqualToHash(token)) {
                res.send("Incorrect token")
            } else {
                this.db.insertProject(name,  techStack,  description,  languages, type, github, images, video, production)
                    .then(project => {
                        res.send(this.formattedProject(project))
                    })
                    .catch(error => {
                        this.c.log(error)
                        res.send("Unable to create project")
                    })
            }
        })

        // Update
        this.server.post("/projects/:id/update", (req, res) => {
            this.logActionAttempt(AccessType.PUT, "Project")

            const { token, id } = req.body
            const name = req.body.name
            const description = req.body.description
            const techStack = req.body.techStack
            const languages = req.body.languages
            const github = req.body.github
            const type = req.body.type
            const images = req.body.images
            const video = req.body.video
            const production = req.body.production

            if (!this.isEqualToHash(token)) {
                res.send("Incorrect token")
            } else {
                this.db.updateProject(id, name, techStack, description, languages, github, production, type, video, images)
                    .then(project => {
                        res.send(this.formattedProject(project))
                    })
                    .catch(error => {
                        this.c.log(error)
                        res.send("Unable to create project")
                    })
            }
        })

        // Delete
        this.server.delete("/projects/:id/delete", (req, res) => {
            this.logActionAttempt(AccessType.DELETE, "Project")
            const { token } = req.body
            const { id } = req.params
            const numId = Number(id)

            if (isNaN(numId)) {
                res.send("id must be a number")
                return
            }

            if (!this.isEqualToHash(token)) {
                res.send("Incorrect token")
            } else {
                this.db.deleteProject(numId, error => {
                    if (error) {
                        this.c.log(error)
                        res.send("There was an issue trying to delete project with id: " + id)
                    } else {
                        res.send("Success")
                    }
                })
            }
        })
    }

    private timelineEndpoints() {
        // Read
        this.server.get(
            "/timeline",
            (req, res) => {
                this.logActionAttempt(AccessType.GET, "All Timelines")
                this.db.allTimelineEntries()
                    .then(entries => {
                        res.send(entries)
                    })
                    .catch(error => {
                        this.c.log(error)
                        res.send("Unable to get timeline entries")
                    })
            }
        )

        // Read single project
        this.server.get(
            "/timeline/:id", 
            (req, res) => {
                this.logActionAttempt(AccessType.GET, "Timeline")
                const { id } = req.params
                const numId = Number(id)

                if (isNaN(numId)) {
                    res.send("id must be a number")
                    return
                }

                this.db.getTimeline(numId)
                    .then(project => {
                        res.send(project)
                    })
                    .catch(error => {
                        this.c.log(error)
                        res.send("Unable to get timeline with id: " + id)
                    })
            }
        )

        // Create
        this.server.post("/timeline/newEntry", (req, res) => {
            this.logActionAttempt(AccessType.POST, "Timeline")
            const { token, start, title, description } = req.body
            const end = req.body.end
            const link = req.body.link

            console.log("Creating new entry")

            if (!this.isEqualToHash(token)) {
                res.send("Incorrect token")
            } else {
                this.db.insertTimeline(this.formattedDate(start, true), title, description, this.formattedDate(end), link)
                    .then(entry => {
                        res.send(entry)
                    })
                    .catch(error => {
                        this.c.log(error)
                        res.send("Unable to create timeline")
                    })
            }
        })

        // Update
        this.server.post("/timeline/:id/update", (req, res) => {
            this.logActionAttempt(AccessType.PUT, "Timeline")
            const { id } = req.params
            const numId = Number(id)

            if (isNaN(numId)) {
                res.send("id must be a number")
                return
            }

            const { token } = req.body
            const start = req.body.start
            const title  = req.body.title
            const description = req.body.description
            const end = req.body.end
            const link = req.body.link

            if (!this.isEqualToHash(token)) {
                res.send("Incorrect token")
            } else {
                this.db.updateTimeline(numId, this.formattedDate(start), this.formattedDate(end), title, description, link)
                    .then(entry => {
                        res.send(entry)
                    })
                    .catch(error => {
                        this.c.log(error)
                        res.send("Unable to create timeline")
                    })
            }
        })

        // Delete
        this.server.delete("/timeline/:id/delete", (req, res) => {
            this.logActionAttempt(AccessType.DELETE, "Timeline")
            const { token } = req.body
            const { id } = req.params
            const numId = Number(id)

            if (isNaN(numId)) {
                res.send("id must be a number")
                return
            }

            if (!this.isEqualToHash(token)) {
                res.send("Incorrect token")
            } else {
                this.db.deleteTimeline(numId, error => {
                    if (error) {
                        this.c.log(error)
                        res.send("There was an issue trying to delete timeline with id: " + id)
                    } else {
                        res.send("Success")
                    }
                })
            }
        })
    }

    private static hash = "e3c774a0e94f7c75a3f791c5347f3ec495b80fd613cbe33b7fc8ce4453739e3a"
}