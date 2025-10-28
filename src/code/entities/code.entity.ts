import { Entity, Column } from 'typeorm';
import { Feedback } from 'src/feedback/entities/feedback.entity';

@Entity()
export class Code extends Feedback
{
    @Column('simple-json')
    programmingLanguages: string[];

    @Column()
    fileName: string;
}
