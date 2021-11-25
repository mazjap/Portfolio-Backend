import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"

@Entity()
export default class Timeline {
    @PrimaryGeneratedColumn() id: number
    @Column({ type: "datetime" }) start: Date
    @Column({ type: "datetime", nullable: true }) end?: Date
    @Column({ type: "longtext" }) title: string
    @Column() description: string
    @Column({ nullable: true  }) link?: string
}
