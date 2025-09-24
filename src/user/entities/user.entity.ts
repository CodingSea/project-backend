import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class User 
{
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 30 })
    first_name: string;

    @Column({ type: 'varchar', length: 30 })
    last_name: string;

    @Column({ type: "varchar", length: 50 })
    email: string

    @Column({ type: 'varchar' })
    password: string;

    @Column({type: 'enum', enum: ["admin", "developer"]})
    role: string;

    @Column({ type: "varchar" })
    profileImage: string

    @Column({ type: "varchar" })
    profileImageID: string

    @Column({ type: "varchar", array: true })
    skills: string[]
}
