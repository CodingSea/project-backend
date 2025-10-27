import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from 'src/user/entities/user.entity';

@Entity({ name: 'certificate' })
export class Certificate {
  @PrimaryGeneratedColumn()
  certificateID: number;

  @ManyToOne(() => User, (user) => user.certificates, { onDelete: 'CASCADE' })
  user: User;

  @Column({ length: 120 })
  name: string;

  @Column()
  type: string;

  @Column()
  issuingOrganization: string;

  @Column({ type: 'date' })
  issueDate: Date;

  @Column({ type: 'date', nullable: true })
  expiryDate: Date;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'json', nullable: true })
  certificateFile?: { name: string; url: string }[];

  @CreateDateColumn()
  createdAt: Date;
}
