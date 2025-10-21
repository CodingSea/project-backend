import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from 'src/user/entities/user.entity';

@Entity()
export class Certificate
{
  @PrimaryGeneratedColumn()
  certificateID: number;

  @ManyToOne(() => User, user => user.certificates)
  user: User;

  @Column()
  name: string;

  @Column()
  type: string;

  @Column()
  issuingOrganization: string;

  @Column()
  issueDate: Date;

  @Column()
  expiryDate: Date;

  @Column({ nullable: true })
  description: string;

  @Column('text', { array: true, nullable: true }) // If you're storing multiple files
  certificateFile: string[];

  @CreateDateColumn()
  createdAt: Date;
}
