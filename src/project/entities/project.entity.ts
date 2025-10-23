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

  @Column({ type: 'varchar', length: 50, nullable: true })
  status: string;

  @OneToMany(() => Service, (service) => service.project, { cascade: true })
  services: Service[];
}
