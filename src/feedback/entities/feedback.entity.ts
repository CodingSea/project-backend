import { Issue } from 'src/issue/entities/issue.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

@Entity()
export class Feedback 
{
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Issue, (issue) => issue.feedbacks)
    issue: Issue;

    @Column({ default: false })
    isPinned: boolean;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updatedAt: Date;
}
