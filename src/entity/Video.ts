import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, JoinColumn } from "typeorm"
import Project from "./Project"

@Entity()
export default class Video {
    @PrimaryGeneratedColumn() id: number
    @CreateDateColumn({ type: "datetime" }) added: Date
    @Column() url: string
    @OneToOne(() => Project, project => project.video, { onDelete: "CASCADE" }) 
    @JoinColumn()
    project: Project
}