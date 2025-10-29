import { Entity, Column } from 'typeorm';
import { Feedback } from 'src/feedback/entities/feedback.entity';

@Entity()
export class Comment extends Feedback
{
    @Column()
    content: string;
}
