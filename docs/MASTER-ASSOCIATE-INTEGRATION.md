# Master Associate - Convex Integration

## 📁 File Structure

```
crm-tools/
├── app/dashboard-manager/master-associate/
│   └── page.tsx                          # UI Halaman Master Associate
├── components/
│   └── master-associate-dialog.tsx       # Dialog Form Add/Edit
├── lib/actions/
│   └── master-associate-actions.ts       # Server Actions (Bridge ke Convex)
├── convex/
│   ├── schema.ts                         # Database Schema
│   ├── masterAssociate.ts                # Convex Functions (CRUD)
│   ├── importBatch.ts                    # Migration Script
│   └── associatesData.ts                 # Static Data (Generated)
└── data/
    └── master-associate.json             # Original Data (Legacy)
```

## 🔄 Data Flow

### 1. GET (Read Data)
```
page.tsx (fetchAssociates)
  ↓ calls
lib/actions/master-associate-actions.ts (getAssociates)
  ↓ calls
convex/masterAssociate.ts (getAssociates query)
  ↓ returns
Convex Database → Server Action → UI
```

### 2. ADD (Create Data)
```
master-associate-dialog.tsx (handleSubmit)
  ↓ calls
lib/actions/master-associate-actions.ts (addAssociate)
  ↓ calls
convex/masterAssociate.ts (addAssociate mutation)
  ↓ inserts
Convex Database → Returns result → Toast notification
```

### 3. UPDATE (Edit Data)
```
master-associate-dialog.tsx (handleSubmit)
  ↓ calls
lib/actions/master-associate-actions.ts (updateAssociate)
  ↓ calls
convex/masterAssociate.ts (updateAssociate mutation)
  ↓ updates
Convex Database → Returns result → Refresh data
```

### 4. DELETE (Remove Data)
```
page.tsx (confirmDelete)
  ↓ calls
lib/actions/master-associate-actions.ts (deleteAssociate)
  ↓ calls
convex/masterAssociate.ts (deleteAssociate mutation)
  ↓ deletes
Convex Database → Returns result → Refresh data
```

## 🗄️ Convex Schema

```typescript
masterAssociate: defineTable({
  kode: v.string(),                              // ASS001, ASS002, etc
  nama: v.string(),                              // Nama associate
  kategori: v.union(
    v.literal("Direct"),
    v.literal("Associate")
  ),
  status: v.union(
    v.literal("Aktif"),
    v.literal("Non-Aktif")
  ),
  createdAt: v.number(),
  updatedAt: v.number(),
})
.index("by_kode", ["kode"])
.index("by_kategori", ["kategori"])
.index("by_status", ["status"])
```

## 📊 Available Functions

| Function | Type | Description |
|----------|------|-------------|
| `getAssociates` | Query | Get all associates, sorted by kode |
| `getAssociateByKode` | Query | Get single associate by kode |
| `addAssociate` | Mutation | Add new associate (auto-generate kode) |
| `updateAssociate` | Mutation | Update existing associate |
| `deleteAssociate` | Mutation | Delete associate by kode |
| `importFromJSON` | Mutation | Batch import from JSON (used for migration) |
| `importBatch` | Mutation | One-time import function |

## 🚀 Deployment

### Development
```bash
# Start Convex dev
npx convex dev

# Start Next.js
npm run dev
```

### Production
```bash
# Deploy Convex
npx convex deploy

# Deploy to Vercel
vercel --prod
```

## ✅ Benefits of Using Convex

1. **Persistent Storage** - Data tidak hilang saat redeploy
2. **Real-time Updates** - Otomatis sync across clients
3. **Scalable** - Tanpa konfigurasi database server
4. **Type Safe** - Full TypeScript support
5. **No File System Dependencies** - Works on Vercel/AWS Lambda

## 📝 Notes

- File `data/master-associate.json` sekarang hanya sebagai backup/reference
- Semua operasi CRUD dilakukan melalui Convex functions
- Server actions bertindak sebagai bridge antara Next.js dan Convex
- UI components tidak perlu perubahan karena menggunakan server actions
