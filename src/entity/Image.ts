import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from "typeorm"
import Project from "./Project"

export enum ImageType {
    PROJECT,
    TIMELINE
}

@Entity()
export default class Image {
    @PrimaryGeneratedColumn() id: number
    @CreateDateColumn({ type: "datetime" }) added: Date
    @Column() url: string
    @ManyToOne(() => Project, project => project.images, { onDelete: "CASCADE" }) project: Project
}