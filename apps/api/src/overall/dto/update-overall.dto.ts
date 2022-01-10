import { PartialType } from '@nestjs/mapped-types';
import { CreateOverallDto } from './create-overall.dto';

export class UpdateOverallDto extends PartialType(CreateOverallDto) {}
