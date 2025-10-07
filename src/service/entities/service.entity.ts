import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, JoinTable, OneToMany, OneToOne } from 'typeorm';
import { Project } from 'src/project/entities/project.entity';
import { User } from 'src/user/entities/user.entity';
import { Comment } from 'src/comment/entities/comment.entity';
import { TaskBoard } from 'src/task-board/entities/task-board.entity';

@Entity()
export class Service
{
    @PrimaryGeneratedColumn()
    serviceID: number;

    @Column({ type: 'varchar' })
    name: string;

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

    @OneToOne(() => TaskBoard, (taskBoard) => taskBoard.service, { cascade: true })
    taskBoard: TaskBoard;
}
