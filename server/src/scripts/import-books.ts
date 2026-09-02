/**
 * 聚合数据图书导入脚本 — 直接拉全量入库
 * 用法：npx tsx src/scripts/import-books.ts
 */

import axios from 'axios'
import { config } from 'dotenv'
import { resolve } from 'path'
import { PrismaClient } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

config({ path: resolve(__dirname, '../../.env') })

const prisma: any = new PrismaClient({
  adapter: new PrismaMariaDb(process.env.DATABASE_URL as string),
})
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const API_URL = 'https://apis.juhe.cn/goodbook/query'
const API_KEY = '175c7de31fdecb9a228995010b8fb11d'

async function searchJuhe(page = 1) {
  const res = await axios.get(API_URL, {
    params: { key: API_KEY, catalog_id: '1', pn: String(page), rn: '100', dtype: 'json', q: '' },
    timeout: 15000,
  })
  if (res.status === 200) return res.data.result.data
  console.log('请求异常')
  return []
}

async function main() {
  let totalBooks = 0
  let totalTags = 0

  console.log('\n===== 开始拉取图书数据 =====')
  const books = await searchJuhe()
  console.log(` 命中: ${books?.length || 0} 本`)

  if (!books || books.length === 0) {
    console.log('无数据，退出')
    return
  }

  for (const b of books) {
    if (!b.title) continue

    /* 去重：按书名 */
    const exist = await prisma.books.findFirst({ where: { title: b.title } })
    if (exist) {
      console.log(`  [跳过] ${b.title}`)
      continue
    }

    /* 处理分类 → 收集 categoryIds */
    const categoryIds: number[] = []
    if (b.catalog && typeof b.catalog === 'string') {
      const parts = b.catalog
        .replace(/\u3000/g, ' ')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((s: string) => s.trim())
      for (const catName of parts) {
        let cat = await prisma.categories.findFirst({ where: { name: catName } })
        if (!cat) {
          cat = await prisma.categories
            .create({
              data: { name: catName, parentId: 0 },
            })
            .catch(async () => {
              return await prisma.categories.findFirst({ where: { name: catName } })
            })
          console.log(`  [新分类] ${catName}`)
        }
        categoryIds.push(cat.id)
      }
    }

    /* 插入图书 */
    const book = await prisma.books.create({
      data: {
        title: b.title,
        author: b.author ?? '',
        isbn: b.isbn ?? null,
        coverUrl: b.img ?? null,
        price: b.price ? Number(b.price) : 59.0,
        originalPrice: null,
        description: b.sub2 ?? null,
        language: '中文',
        stock: 100,
        salesCount: 0,
        viewCount: 0,
        rating: 5.0,
        status: 1,
        reading: b.reading,
      },
    })

    /* 写入图书-分类关联 */
    for (const cid of categoryIds) {
      await prisma.BookCategoryRelations.create({
        data: { bookId: book.id, categoryId: cid },
      }).catch(() => {
        console.log('插入失败')
      })
    }

    /* 标签处理 */
    let tagCount = 0
    if (b.tags && typeof b.tags === 'string') {
      for (const tagName of b.tags.split(/\s+/).filter(Boolean).slice(0, 10)) {
        let tag = await prisma.tags.findFirst({ where: { name: tagName } })
        if (!tag) {
          tag = await prisma.tags.create({ data: { name: tagName } })
          totalTags++
        }
        await prisma.BookTagRelations.create({
          data: { bookId: book.id, tagId: tag.id },
        }).catch(() => {})
        tagCount++
      }
    }

    totalBooks++
    console.log(`  [导入] ${b.title}（分类 ${categoryIds.length} / 标签 ${tagCount}）`)
    await sleep(1500)
  }

  console.log(`\n===== 完成 =====`)
  console.log(`图书: ${totalBooks} 本  新标签: ${totalTags} 个`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
