import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Service } from 'src/service/entities/service.entity';

@Entity({ name: 'project' }) // match table name in DB
export class Project {
  @PrimaryGeneratedColumn()
  projectID: number;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'date', nullable: true })
  dueDate: Date;

  @Column({ type: 'varchar', length: 50, nullable: true })
  status: string;

  @Column({ type: 'int', default: 0 })
  progress: number;

  @OneToMany(() => Service, (service) => service.project, { cascade: true })
  services: Service[];
}
