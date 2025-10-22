import
{
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    ManyToMany,
    JoinTable,
    OneToMany,
    OneToOne,
    JoinColumn,
} from 'typeorm';
import { Project } from 'src/project/entities/project.entity';
import { User } from 'src/user/entities/user.entity';
import { Comment } from 'src/comment/entities/comment.entity';
import { TaskBoard } from 'src/task-board/entities/task-board.entity';

export enum ServiceStatus
{
    Pending = 'pending',
    InProgress = 'in-progress',
    Completed = 'completed',
}

@Entity({ name: 'service' })
export class Service
{
    @PrimaryGeneratedColumn()
    serviceID: number;

    @Column({ length: 120 })
    name: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'date', nullable: true })
    deadline?: Date;

    @Column({ type: 'enum', enum: ServiceStatus, default: ServiceStatus.Pending })
    status: ServiceStatus;

    @Column({ type: 'int', default: 0 })
    progress: number;

    @ManyToOne(() => Project, (project) => project.services, {
        onDelete: 'CASCADE',
        nullable: true,
    })
    project?: Project;

    @ManyToOne(() => User, { nullable: true })
    chief?: User;

    @ManyToOne(() => User, { nullable: true })
    projectManager?: User;

    @ManyToMany(() => User)
    @JoinTable()
    assignedResources?: User[];

    @ManyToOne(() => User, { nullable: true })
    backup?: User;

    @OneToMany(() => Comment, (comment) => comment.service, { cascade: true })
    comments: Comment[];

    @OneToOne(() => TaskBoard, (taskBoard) => taskBoard.service, { cascade: true })
    taskBoard: TaskBoard;

    @Column('text', { array: true, nullable: true })
    serviceFile: string[];
}
