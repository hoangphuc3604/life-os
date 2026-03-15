import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async search(userId: string, query: string, limit = 20, offset = 0) {
    const notes = await this.prisma.$queryRaw`
      SELECT n.id, n.title, n.icon, n.cover, n.updated_at,
             ts_headline('english', 
               COALESCE(n.title, '') || ' ' || 
               COALESCE(jsonb_agg(b.content::text)::text, ''), 
               plainto_tsquery('english', ${query}),
               'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=20'
             ) as highlight
      FROM notes n
      LEFT JOIN blocks b ON b.note_id = n.id
      WHERE n.user_id = ${userId}
        AND (
          to_tsvector('english', COALESCE(n.title, '')) @@ plainto_tsquery('english', ${query})
          OR to_tsvector('english', COALESCE(b.content::text, '')) @@ plainto_tsquery('english', ${query})
        )
      GROUP BY n.id
      ORDER BY n.updated_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    
    return notes;
  }
}
