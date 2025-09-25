import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import { Project } from 'src/project/entities/project.entity';
import { User } from 'src/user/entities/user.entity';
import { Comment } from 'src/comment/entities/comment.entity';

@Entity()
export class Service
{
    @PrimaryGeneratedColumn()
    serviceID: number;

    @ManyToOne(() => Project, (project) => project.services, { onDelete: 'CASCADE' })
    project: Project;

    @Column({ type: 'timestamp' })
    deadline: Date;

    @Column({
        type: 'enum',
        enum: [ 'pending', 'in-progress', 'completed' ],
        default: 'pending',
    })
    status: string;

    @ManyToOne(() => User, { nullable: false })
    chief: User;

    @ManyToOne(() => User, { nullable: true })
    projectManager: User;

    @ManyToMany(() => User, { nullable: true })
    @JoinTable()
    assignedResources: User[];

    @ManyToMany(() => User, { nullable: true })
    @JoinTable()
    backup: User[];

    @OneToMany(() => Comment, (comment) => comment.service, { cascade: true })
    comments: Comment[];
}
