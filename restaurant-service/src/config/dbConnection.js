import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const connectionString = 'postgresql://postgres:Aliki211112@uberclonedb.c3i2i48w2k27.ap-northeast-1.rds.amazonaws.com:5432/uberclonedb?schema=public';
const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

export default prisma