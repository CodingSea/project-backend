import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Feedback } from 'src/feedback/entities/feedback.entity';

@Entity()
export class Issue 
{
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    status: string;

    @Column()
    categories: string;

    @Column()
    createdBy: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updatedAt: Date;

    @OneToMany(() => Feedback, (feedback) => feedback.issue)
    feedbacks: Feedback[];
}
