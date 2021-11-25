import { createConnection, Connection, FindManyOptions, ConnectionManager, Repository } from "typeorm"
import Log from "./Log"
import "reflect-metadata"
import Project from "../entity/Project"
import Timeline from "../entity/Timeline"
import Image from "../entity/Image"
import Video from "../entity/Video"
import AccessType from "./AccessType"


export default class Database {
    private c: Log
    private connection!: Connection

    constructor(log: Log, onSetupComplete: (Error?) => void, resetAllTables: boolean = false) {
        this.c = log

        createConnection()
            .then(
                async connection => {
                    if (resetAllTables) {
                        await connection.dropDatabase()
                    }
                    await connection.synchronize()
                    
                    this.connection = connection
                    onSetupComplete()
                }
            )
            .catch(onSetupComplete)
    }

    private logActionAttempt(action: AccessType, type: string) {
        let actionText = AccessType[action]

        if (action === 1) {
            actionText += " new"
        }

        this.c.log(`Attempting to ${actionText} type ${type} from database`)
    }

    private toImages(urlArr: string[]): Promise<Image[]> {
        return new Promise((res, rej) => {
            const repo = this.connection.getRepository(Image)
            let imageArray: Image[] = []
            Promise.all(
                urlArr.map(
                    url => new Promise<Image>((res, rej) => {
                        const image = new Image()
                        image.url = url

                        repo.save(image)
                            .then(res)
                            .catch(rej)
                    })
                )
            )
            .then(images => {
                console.log(images)
                res(images)
            })
            .catch(rej)
        })
    }

    // Project

    allProjects(): Promise<Project[]> {
        this.logActionAttempt(AccessType.GET, "All Projects")

        const projectRepo = this.connection.getRepository(Project)
        return projectRepo.find()
    }

    getProject(id: number): Promise<Project> {
        this.logActionAttempt(AccessType.GET, "Project")

        const projectRepo = this.connection.getRepository(Project)
        return projectRepo.findOne({ id: id })
    }
    
    insertProject(
        name: string, 
        techStack: string, 
        description: string, 
        languages: string[],
        type: number,
        github: string,
        images: string[],
        video?: string,
        production?: string
    ): Promise<Project> {
        this.logActionAttempt(AccessType.POST, "Project")

        const projectRepo = this.connection.getRepository(Project)
        const project = new Project()

        project.name = name
        project.techStack = techStack
        project.description = description
        project.languages = languages.join(",")
        project.github = github
        project.production = production
        project.type = type
        
        if (video) {
            const vid = new Video()
            vid.url = video

            this.connection.manager.save(vid)

            project.video = vid
        }

        console.log(project)

        return new Promise((res, rej) => {
            this.toImages(images)
                .then(images => {
                    console.log(images)
                    project.images = images

                    projectRepo.save(project)
                        .then(res)
                        .catch(rej)

                    console.log(project)
                })
                .catch(rej)
        })
    }
    
    updateProject(
        id: number,
        name?: string, 
        techStack?: string, 
        description?: string, 
        languages?: string[],
        github?: string,
        production?: string,
        type?: number,
        video?: string,
        images?: string[]
    ): Promise<Project> {
        return new Promise((res, rej) => {
            this.logActionAttempt(AccessType.PUT, "Project")
    
            const projectRepo = this.connection.getRepository(Project)
            projectRepo.findOne(id)
                .then(project => {
                    if (name) {
                        project.name = name
                    }
            
                    if (techStack) {
                        project.techStack = techStack
                    }
            
                    if (description) {
                        project.description = description
                    }
            
                    if (languages) {
                        project.languages = languages.join(",")
                    }
            
                    if (github) {
                        project.github = github
                    }
            
                    if (production) {
                        project.production = production
                    }
            
                    if (type) {
                        project.type = type
                    }

                    if (video) {
                        const vid = new Video()
                        vid.url = video

                        this.connection.manager.save(vid)

                        project.video = vid
                    }
            
                    if (images) {
                        this.toImages(images)
                            .then(images => {
                                project.images = images
                                projectRepo.save(project)
                                    .then(res)
                                    .catch(rej)
                            })
                            .catch(rej)
                    }
                })
                .catch(rej)
        })
    }
    
    deleteProject(id: number, callback: (error?: string | Error) => void) {
        this.logActionAttempt(AccessType.DELETE, "Project")

        const projectRepo = this.connection.getRepository(Project)
        projectRepo.delete(id)
            .then(() => callback())
            .catch(callback)
    }

    // Timeline

    allTimelineEntries(): Promise<Timeline[]> {
        this.logActionAttempt(AccessType.GET, "All Timelines")

        const timelineRepo = this.connection.getRepository(Timeline)
        return timelineRepo.find()
    }

    getTimeline(id: number): Promise<Timeline> {
        this.logActionAttempt(AccessType.GET, "Timeline")

        const timelineRepo = this.connection.getRepository(Timeline)
        
        return timelineRepo.findOne({ id: id })
    }

    insertTimeline(
        start: Date,
        title: string, 
        description: string, 
        end?: Date,
        link?: string
    ): Promise<Timeline> {
        this.logActionAttempt(AccessType.POST, "Timeline")

        const timeline = new Timeline()

        timeline.start = start
        timeline.title = title
        timeline.description = description
        timeline.end = end
        timeline.link = link

        return this.connection.manager.save(timeline)
    }

    updateTimeline(
        id: number,
        start?: Date, 
        end?: Date, 
        title?: string, 
        description?: string,
        link?: string
    ): Promise<Timeline> {
        return new Promise((res, rej) => {
            this.logActionAttempt(AccessType.PUT, "Timeline")

            const timelineRepo = this.connection.getRepository(Timeline)

            timelineRepo.findOne(id)
                .then(timeline => {
                    if (start) {
                        timeline.start = start
                    }
        
                    if (title) {
                        timeline.title = title
                    }
        
                    if (description) {
                        timeline.description = description
                    }
        
                    if (end) {
                        timeline.end = end
                    }
        
                    if (link) {
                        timeline.link = link
                    }
        
                    timelineRepo.save(timeline)
                        .then(res)
                        .catch(rej)
                })
                .catch(rej)
        })
    }

    deleteTimeline(id: number, callback: (error?: string | Error) => void) {
        this.logActionAttempt(AccessType.DELETE, "Timeline")

        const timelineRepo = this.connection.getRepository(Timeline)
        timelineRepo.delete(id)
            .then(() => callback())
            .catch(callback)
    }
}