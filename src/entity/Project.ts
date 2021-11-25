import { Entity, Column, PrimaryGeneratedColumn, OneToMany, OneToOne } from "typeorm"
import Image from "./Image"
import Video from "./Video"

export enum ProjectType {
    WEB,
    IOS
}

export enum ProjectSort {
    NAME,
    IMAGE_COUNT
}

export enum ProjectFilter {
    WEB = ProjectType.WEB,
    IOS = ProjectType.IOS,
    ON_APPSTORE,
    HAS_IMAGES
}

// Entity
@Entity()
export default class Project {
    @PrimaryGeneratedColumn() id: number
    @Column({ type: "longtext" }) name: string
    @Column() techStack: string
    @Column() description: string
    @Column() languages: string
    @Column() github: string
    @Column({ nullable: true }) production?: string
    @Column() type: number
    @OneToMany(() => Image, image => image.project, { eager: true, cascade: true }) images: Image[]
    @OneToOne(() => Video, video => video.project, { eager: true, cascade: true, nullable: true }) video?: Video
}