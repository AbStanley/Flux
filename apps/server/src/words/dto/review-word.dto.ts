import { IsInt, Min, Max } from 'class-validator';

export class ReviewWordDto {
  @IsInt()
  @Min(0)
  @Max(5)
  quality: number = 0;
}
