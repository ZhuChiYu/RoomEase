import { ApiProperty } from '@nestjs/swagger'
import { IsArray, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

class RoomOrderUpdate {
  @ApiProperty({ example: 'room-id-123' })
  id: string

  @ApiProperty({ example: 0 })
  sortOrder: number
}

export class BatchUpdateOrderDto {
  @ApiProperty({ 
    type: [RoomOrderUpdate],
    example: [
      { id: 'room-id-1', sortOrder: 0 },
      { id: 'room-id-2', sortOrder: 1 },
      { id: 'room-id-3', sortOrder: 2 }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoomOrderUpdate)
  updates: RoomOrderUpdate[]
}

