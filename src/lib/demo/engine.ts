/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================================
// موتور دادهٔ نمایشی (Demo Data Engine)
//
// این فایل یک جایگزین کامل و «بدون پایگاه داده» برای کلاینت Prisma است.
// همهٔ کوئری‌های پروژه (findMany/findUnique/create/update/count/aggregate/...)
// روی داده‌های درون‌حافظه‌ای اجرا می‌شوند تا کل پنل به‌صورت بصری و تعاملی
// کار کند، بدون هیچ اتصالی به Postgres.
// ============================================================================

export type Row = Record<string, any>;
export type Tables = Record<string, Row[]>;

type RelationDef = {
  model: string;
  many: boolean;
  local: string;
  foreign: string;
};

// ============================================================================
// نقشهٔ روابط بین مدل‌ها (معادل relation در schema.prisma)
// ============================================================================

const RELATIONS: Record<string, Record<string, RelationDef>> = {
  user: {
    artistProfile: { model: "artistProfile", many: false, local: "id", foreign: "userId" },
    clientBookings: { model: "booking", many: true, local: "id", foreign: "clientId" },
    artistBookings: { model: "booking", many: true, local: "id", foreign: "artistId" },
    customRequests: { model: "customRequest", many: true, local: "id", foreign: "clientId" },
    givenReviews: { model: "review", many: true, local: "id", foreign: "authorId" },
    receivedReviews: { model: "review", many: true, local: "id", foreign: "recipientId" },
    sentMessages: { model: "message", many: true, local: "id", foreign: "senderId" },
    conversations: { model: "conversationParticipant", many: true, local: "id", foreign: "userId" },
    wallet: { model: "wallet", many: false, local: "id", foreign: "ownerId" },
    transactions: { model: "transaction", many: true, local: "id", foreign: "userId" },
    savedPortfolios: { model: "savedPortfolio", many: true, local: "id", foreign: "userId" },
    portfolioLikes: { model: "portfolioLike", many: true, local: "id", foreign: "userId" },
    flashLikes: { model: "flashLike", many: true, local: "id", foreign: "userId" },
    blogComments: { model: "blogComment", many: true, local: "id", foreign: "userId" },
    commentReactions: { model: "commentReaction", many: true, local: "id", foreign: "userId" },
    passwordHistory: { model: "passwordHistory", many: true, local: "id", foreign: "userId" },
    followers: { model: "artistFollower", many: true, local: "id", foreign: "userId" },
    notifications: { model: "notification", many: true, local: "id", foreign: "userId" },
    sentNotifications: { model: "notification", many: true, local: "id", foreign: "senderId" },
    notificationReplies: { model: "notificationReply", many: true, local: "id", foreign: "senderId" },
    waitlistEntries: { model: "waitlist", many: true, local: "id", foreign: "userId" },
    clientNotesReceived: { model: "clientNote", many: true, local: "id", foreign: "clientId" },
    blogPosts: { model: "blogPost", many: true, local: "id", foreign: "authorId" },
    auditLogs: { model: "auditLog", many: true, local: "id", foreign: "adminId" },
  },
  passwordHistory: {
    user: { model: "user", many: false, local: "userId", foreign: "id" },
  },
  artistProfile: {
    user: { model: "user", many: false, local: "userId", foreign: "id" },
    studioArtists: { model: "studioArtist", many: true, local: "id", foreign: "artistProfileId" },
    portfolioItems: { model: "portfolioItem", many: true, local: "id", foreign: "artistProfileId" },
    flashTattoos: { model: "flashTattoo", many: true, local: "id", foreign: "artistProfileId" },
    availabilities: { model: "availability", many: true, local: "id", foreign: "artistProfileId" },
    followers: { model: "artistFollower", many: true, local: "id", foreign: "artistProfileId" },
    customRequests: { model: "customRequest", many: true, local: "id", foreign: "artistId" },
    services: { model: "service", many: true, local: "id", foreign: "artistProfileId" },
    timeOffs: { model: "timeOff", many: true, local: "id", foreign: "artistProfileId" },
    waitlist: { model: "waitlist", many: true, local: "id", foreign: "artistProfileId" },
    clientNotes: { model: "clientNote", many: true, local: "id", foreign: "artistId" },
  },
  artistFollower: {
    user: { model: "user", many: false, local: "userId", foreign: "id" },
    artistProfile: { model: "artistProfile", many: false, local: "artistProfileId", foreign: "id" },
  },
  savedPortfolio: {
    user: { model: "user", many: false, local: "userId", foreign: "id" },
    portfolioItem: { model: "portfolioItem", many: false, local: "portfolioItemId", foreign: "id" },
  },
  portfolioLike: {
    user: { model: "user", many: false, local: "userId", foreign: "id" },
    portfolioItem: { model: "portfolioItem", many: false, local: "portfolioItemId", foreign: "id" },
  },
  flashLike: {
    user: { model: "user", many: false, local: "userId", foreign: "id" },
    flashTattoo: { model: "flashTattoo", many: false, local: "flashTattooId", foreign: "id" },
  },
  studio: {
    studioArtists: { model: "studioArtist", many: true, local: "id", foreign: "studioId" },
    bookings: { model: "booking", many: true, local: "id", foreign: "studioId" },
  },
  studioArtist: {
    artistProfile: { model: "artistProfile", many: false, local: "artistProfileId", foreign: "id" },
    studio: { model: "studio", many: false, local: "studioId", foreign: "id" },
  },
  service: {
    artistProfile: { model: "artistProfile", many: false, local: "artistProfileId", foreign: "id" },
    bookings: { model: "booking", many: true, local: "id", foreign: "serviceId" },
  },
  portfolioItem: {
    artistProfile: { model: "artistProfile", many: false, local: "artistProfileId", foreign: "id" },
    reviews: { model: "review", many: true, local: "id", foreign: "portfolioItemId" },
    savedBy: { model: "savedPortfolio", many: true, local: "id", foreign: "portfolioItemId" },
    likes: { model: "portfolioLike", many: true, local: "id", foreign: "portfolioItemId" },
  },
  flashTattoo: {
    artistProfile: { model: "artistProfile", many: false, local: "artistProfileId", foreign: "id" },
    flashLikes: { model: "flashLike", many: true, local: "id", foreign: "flashTattooId" },
  },
  availability: {
    artistProfile: { model: "artistProfile", many: false, local: "artistProfileId", foreign: "id" },
    bookings: { model: "booking", many: true, local: "id", foreign: "availabilityId" },
  },
  timeOff: {
    artistProfile: { model: "artistProfile", many: false, local: "artistProfileId", foreign: "id" },
  },
  booking: {
    client: { model: "user", many: false, local: "clientId", foreign: "id" },
    artist: { model: "user", many: false, local: "artistId", foreign: "id" },
    studio: { model: "studio", many: false, local: "studioId", foreign: "id" },
    service: { model: "service", many: false, local: "serviceId", foreign: "id" },
    availability: { model: "availability", many: false, local: "availabilityId", foreign: "id" },
    payments: { model: "payment", many: true, local: "id", foreign: "bookingId" },
    reviews: { model: "review", many: true, local: "id", foreign: "bookingId" },
    customRequest: { model: "customRequest", many: false, local: "customRequestId", foreign: "id" },
  },
  customRequest: {
    client: { model: "user", many: false, local: "clientId", foreign: "id" },
    artist: { model: "artistProfile", many: false, local: "artistId", foreign: "id" },
    booking: { model: "booking", many: false, local: "bookingId", foreign: "id" },
  },
  payment: {
    booking: { model: "booking", many: false, local: "bookingId", foreign: "id" },
    wallet: { model: "wallet", many: false, local: "walletId", foreign: "id" },
    transaction: { model: "transaction", many: false, local: "transactionId", foreign: "id" },
  },
  review: {
    author: { model: "user", many: false, local: "authorId", foreign: "id" },
    recipient: { model: "user", many: false, local: "recipientId", foreign: "id" },
    booking: { model: "booking", many: false, local: "bookingId", foreign: "id" },
    portfolioItem: { model: "portfolioItem", many: false, local: "portfolioItemId", foreign: "id" },
  },
  wallet: {
    owner: { model: "user", many: false, local: "ownerId", foreign: "id" },
    transactions: { model: "transaction", many: true, local: "id", foreign: "walletId" },
    payments: { model: "payment", many: true, local: "id", foreign: "walletId" },
    withdrawalRequests: { model: "withdrawalRequest", many: true, local: "id", foreign: "walletId" },
  },
  transaction: {
    wallet: { model: "wallet", many: false, local: "walletId", foreign: "id" },
    user: { model: "user", many: false, local: "userId", foreign: "id" },
    payment: { model: "payment", many: false, local: "id", foreign: "transactionId" },
  },
  withdrawalRequest: {
    wallet: { model: "wallet", many: false, local: "walletId", foreign: "id" },
  },
  conversation: {
    participants: { model: "conversationParticipant", many: true, local: "id", foreign: "conversationId" },
    messages: { model: "message", many: true, local: "id", foreign: "conversationId" },
  },
  conversationParticipant: {
    conversation: { model: "conversation", many: false, local: "conversationId", foreign: "id" },
    user: { model: "user", many: false, local: "userId", foreign: "id" },
  },
  message: {
    conversation: { model: "conversation", many: false, local: "conversationId", foreign: "id" },
    sender: { model: "user", many: false, local: "senderId", foreign: "id" },
  },
  notification: {
    user: { model: "user", many: false, local: "userId", foreign: "id" },
    sender: { model: "user", many: false, local: "senderId", foreign: "id" },
    replies: { model: "notificationReply", many: true, local: "id", foreign: "notificationId" },
  },
  notificationReply: {
    notification: { model: "notification", many: false, local: "notificationId", foreign: "id" },
    sender: { model: "user", many: false, local: "senderId", foreign: "id" },
  },
  blogPost: {
    author: { model: "user", many: false, local: "authorId", foreign: "id" },
  },
  blogComment: {
    user: { model: "user", many: false, local: "userId", foreign: "id" },
    parent: { model: "blogComment", many: false, local: "parentId", foreign: "id" },
    replies: { model: "blogComment", many: true, local: "id", foreign: "parentId" },
    reactions: { model: "commentReaction", many: true, local: "id", foreign: "commentId" },
  },
  commentReaction: {
    comment: { model: "blogComment", many: false, local: "commentId", foreign: "id" },
    user: { model: "user", many: false, local: "userId", foreign: "id" },
  },
  clientNote: {
    artist: { model: "artistProfile", many: false, local: "artistId", foreign: "id" },
    client: { model: "user", many: false, local: "clientId", foreign: "id" },
  },
  waitlist: {
    user: { model: "user", many: false, local: "userId", foreign: "id" },
    artistProfile: { model: "artistProfile", many: false, local: "artistProfileId", foreign: "id" },
  },
  auditLog: {
    admin: { model: "user", many: false, local: "adminId", foreign: "id" },
  },
  cmsPage: {},
  systemSetting: {},
  contactMessage: {},
  newsletterSubscriber: {},
  searchIndex: {},
};

export const MODELS = Object.keys(RELATIONS);

// ============================================================================
// توابع مقایسه و فیلتر
// ============================================================================

const isPlainObject = (v: any): v is Record<string, any> =>
  typeof v === "object" && v !== null && !Array.isArray(v) && !(v instanceof Date);

function looseEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a === null || a === undefined || b === null || b === undefined) {
    return (a ?? null) === (b ?? null);
  }
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  if (a instanceof Date) return a.getTime() === new Date(b).getTime();
  if (b instanceof Date) return new Date(a).getTime() === b.getTime();
  const aNum = typeof a === "number" || typeof a === "bigint";
  const bNum = typeof b === "number" || typeof b === "bigint";
  if (aNum && bNum) return Number(a) === Number(b);
  if (aNum && typeof b === "string" && b !== "" && !isNaN(Number(b))) return Number(a) === Number(b);
  if (bNum && typeof a === "string" && a !== "" && !isNaN(Number(a))) return Number(b) === Number(a);
  return false;
}

function numOf(v: any): number {
  if (v instanceof Date) return v.getTime();
  if (typeof v === "bigint") return Number(v);
  if (typeof v === "string" && !isNaN(Date.parse(v))) return Date.parse(v);
  return Number(v ?? 0);
}

function matchScalar(value: any, cond: any): boolean {
  if (isPlainObject(cond)) {
    if ("equals" in cond) return matchScalar(value, cond.equals);
    if ("in" in cond) {
      const list = (cond.in || []) as any[];
      return list.some((x) => matchScalar(value, x));
    }
    if ("notIn" in cond) {
      const list = (cond.notIn || []) as any[];
      return !list.some((x) => matchScalar(value, x));
    }
    if ("contains" in cond) {
      const needle = String(cond.contains ?? "");
      const hay = String(value ?? "");
      return cond.mode === "insensitive"
        ? hay.toLowerCase().includes(needle.toLowerCase())
        : hay.includes(needle);
    }
    if ("startsWith" in cond) return String(value ?? "").startsWith(String(cond.startsWith));
    if ("endsWith" in cond) return String(value ?? "").endsWith(String(cond.endsWith));
    if ("gte" in cond) return numOf(value) >= numOf(cond.gte);
    if ("lte" in cond) return numOf(value) <= numOf(cond.lte);
    if ("gt" in cond) return numOf(value) > numOf(cond.gt);
    if ("lt" in cond) return numOf(value) < numOf(cond.lt);
    if ("not" in cond) return !matchScalar(value, cond.not);
    if ("has" in cond) return Array.isArray(value) && value.some((x) => looseEqual(x, cond.has));
    if ("hasEvery" in cond)
      return Array.isArray(value) && (cond.hasEvery || []).every((x: any) => value.some((y) => looseEqual(y, x)));
    if ("hasSome" in cond)
      return Array.isArray(value) && (cond.hasSome || []).some((x: any) => value.some((y) => looseEqual(y, x)));
    if ("isEmpty" in cond) {
      const empty = Array.isArray(value) ? value.length === 0 : !value;
      return cond.isEmpty ? empty : !empty;
    }
    return false;
  }
  if (Array.isArray(value) && !Array.isArray(cond)) {
    return value.some((x) => looseEqual(x, cond));
  }
  if (cond === null) return value === null || value === undefined;
  return looseEqual(value, cond);
}

function relationRows(tables: Tables, rel: RelationDef, row: Row): Row[] {
  const target = tables[rel.model] || [];
  const localValue = row[rel.local];
  if (localValue === undefined || localValue === null) return [];
  return target.filter((t) => looseEqual(t[rel.foreign], localValue));
}

function matchWhere(tables: Tables, model: string, row: Row, where: any, depth = 0): boolean {
  if (!where || depth > 4) return true;
  const rels = RELATIONS[model] || {};
  for (const [key, cond] of Object.entries(where)) {
    if (key === "AND") {
      const list = Array.isArray(cond) ? cond : [cond];
      if (!list.every((c: any) => matchWhere(tables, model, row, c, depth + 1))) return false;
      continue;
    }
    if (key === "OR") {
      const list = Array.isArray(cond) ? cond : [cond];
      if (list.length === 0) continue;
      if (!list.some((c: any) => matchWhere(tables, model, row, c, depth + 1))) return false;
      continue;
    }
    if (key === "NOT") {
      const list = Array.isArray(cond) ? cond : [cond];
      if (list.some((c: any) => matchWhere(tables, model, row, c, depth + 1))) return false;
      continue;
    }
    const rel = rels[key];
    if (rel) {
      const rows = relationRows(tables, rel, row);
      if (!cond || (isPlainObject(cond) && Object.keys(cond).length === 0)) {
        if (rows.length === 0) return false;
        continue;
      }
      const c = cond as any;
      if ("some" in c) {
        if (!rows.some((r) => matchWhere(tables, rel.model, r, c.some, depth + 1))) return false;
        continue;
      }
      if ("every" in c) {
        if (!rows.every((r) => matchWhere(tables, rel.model, r, c.every, depth + 1))) return false;
        continue;
      }
      if ("none" in c) {
        if (rows.some((r) => matchWhere(tables, rel.model, r, c.none, depth + 1))) return false;
        continue;
      }
      if ("isNot" in c) {
        const found = rows.length > 0 && matchWhere(tables, rel.model, rows[0], c.isNot, depth + 1);
        if (found) return false;
        continue;
      }
      const target = "is" in c ? c.is : c;
      const found = rows.length > 0 && matchWhere(tables, rel.model, rows[0], target, depth + 1);
      if (!found) return false;
      continue;
    }
    if (!matchScalar(row[key], cond)) return false;
  }
  return true;
}

// ============================================================================
// مرتب‌سازی
// ============================================================================

function compareValues(a: any, b: any): number {
  if (a === b) return 0;
  if (a === null || a === undefined) return 1;
  if (b === null || b === undefined) return -1;
  if (a instanceof Date || b instanceof Date) return numOf(a) - numOf(b);
  if (typeof a === "number" || typeof a === "bigint" || typeof b === "number" || typeof b === "bigint") {
    return numOf(a) - numOf(b);
  }
  return String(a).localeCompare(String(b), "fa");
}

function sortRows(tables: Tables, model: string, rows: Row[], orderBy: any): Row[] {
  if (!orderBy) return rows;
  const list = Array.isArray(orderBy) ? orderBy : [orderBy];
  return [...rows].sort((a, b) => {
    for (const spec of list) {
      for (const [field, dirRaw] of Object.entries(spec || {})) {
        const dir = typeof dirRaw === "string" ? dirRaw : (dirRaw as any)?.sort || "asc";
        let av: any;
        let bv: any;
        const rel = (RELATIONS[model] || {})[field];
        if (rel) {
          const ar = relationRows(tables, rel, a)[0];
          const br = relationRows(tables, rel, b)[0];
          const innerField = isPlainObject(dirRaw) ? Object.keys(dirRaw)[0] : undefined;
          av = ar ? ar[innerField || "id"] : null;
          bv = br ? br[innerField || "id"] : null;
        } else {
          av = a[field];
          bv = b[field];
        }
        const cmp = compareValues(av, bv);
        if (cmp !== 0) return dir === "desc" ? -cmp : cmp;
      }
    }
    return 0;
  });
}

// ============================================================================
// انتخاب فیلدها (select / include)
// ============================================================================

const MAX_DEPTH = 4;

function resolveCounts(
  tables: Tables,
  model: string,
  row: Row,
  countSelect: Record<string, any>
): Record<string, number> {
  const rels = RELATIONS[model] || {};
  const out: Record<string, number> = {};
  for (const [name, spec] of Object.entries(countSelect || {})) {
    const rel = rels[name];
    if (!rel) {
      out[name] = 0;
      continue;
    }
    let rows = relationRows(tables, rel, row);
    if (isPlainObject(spec) && (spec as any).where) {
      rows = rows.filter((r) => matchWhere(tables, rel.model, r, (spec as any).where));
    }
    out[name] = rows.length;
  }
  return out;
}

function project(tables: Tables, model: string, row: Row, args: any, depth: number): any {
  if (!row) return row;
  if (depth > MAX_DEPTH) return { ...row };
  const rels = RELATIONS[model] || {};
  const select = args?.select;
  const include = args?.include;

  const buildRelation = (rel: RelationDef, spec: any): any => {
    const rows = relationRows(tables, rel, row);
    if (!rel.many) {
      const first = rows[0];
      if (!first) return null;
      return project(tables, rel.model, first, spec, depth + 1);
    }
    let list = rows;
    if (isPlainObject(spec) && (spec as any).where) {
      list = list.filter((r) => matchWhere(tables, rel.model, r, (spec as any).where));
    }
    if (isPlainObject(spec) && (spec as any).orderBy) {
      list = sortRows(tables, rel.model, list, (spec as any).orderBy);
    }
    if (isPlainObject(spec) && typeof (spec as any).take === "number") {
      list = (spec as any).take >= 0 ? list.slice(0, (spec as any).take) : list.slice((spec as any).take);
    }
    return list.map((r) => project(tables, rel.model, r, spec, depth + 1));
  };

  if (select && isPlainObject(select)) {
    const out: Row = {};
    for (const [key, spec] of Object.entries(select)) {
      if (key === "_count") {
        out._count = resolveCounts(tables, model, row, (spec as any)?.select || {});
        continue;
      }
      const rel = rels[key];
      if (rel) {
        out[key] = buildRelation(rel, spec);
        continue;
      }
      if (spec) out[key] = row[key];
    }
    return out;
  }

  const out: Row = { ...row };
  if (include && isPlainObject(include)) {
    for (const [key, spec] of Object.entries(include)) {
      if (key === "_count") {
        out._count = resolveCounts(tables, model, row, (spec as any)?.select || {});
        continue;
      }
      const rel = rels[key];
      if (!rel) continue;
      out[key] = buildRelation(rel, spec);
    }
  }
  return out;
}

function runQuery(tables: Tables, model: string, args: any = {}): Row[] {
  const all = tables[model] || [];
  let rows = all.filter((r) => matchWhere(tables, model, r, args.where));
  if (args.orderBy) rows = sortRows(tables, model, rows, args.orderBy);
  if (args.distinct) {
    const fields = Array.isArray(args.distinct) ? args.distinct : [args.distinct];
    const seen = new Set<string>();
    rows = rows.filter((r) => {
      const key = fields.map((f: string) => String(r[f])).join("|");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  if (typeof args.skip === "number") rows = rows.slice(args.skip);
  if (typeof args.take === "number") rows = args.take >= 0 ? rows.slice(0, args.take) : rows.slice(args.take);
  return rows.map((r) => project(tables, model, r, args, 0));
}

// ============================================================================
// نوشتن (create / update / delete)
// ============================================================================

let idCounter = 0;
function newId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_new_${Date.now().toString(36)}${idCounter.toString(36)}`;
}

const ID_PREFIX: Record<string, string> = {
  user: "usr",
  artistProfile: "ap",
  booking: "bkg",
  payment: "pay",
  service: "svc",
  portfolioItem: "pf",
  flashTattoo: "fl",
  review: "rev",
  conversation: "cnv",
  message: "msg",
  notification: "ntf",
  studio: "std",
};

function applyData(target: Row, data: Row): Row {
  for (const [key, value] of Object.entries(data || {})) {
    if (isPlainObject(value) && value !== null) {
      const op = value as Row;
      if ("increment" in op) {
        target[key] = numOf(target[key]) + numOf(op.increment);
        continue;
      }
      if ("decrement" in op) {
        target[key] = numOf(target[key]) - numOf(op.decrement);
        continue;
      }
      if ("multiply" in op) {
        target[key] = numOf(target[key]) * numOf(op.multiply);
        continue;
      }
      if ("set" in op && Object.keys(op).length === 1) {
        target[key] = op.set;
        continue;
      }
      if ("push" in op) {
        target[key] = [...(target[key] || []), ...(Array.isArray(op.push) ? op.push : [op.push])];
        continue;
      }
      // نوشتن‌های تودرتوی relational در این پیش‌نمایش نادیده گرفته می‌شوند
      continue;
    }
    target[key] = value;
  }
  return target;
}

function materialize(model: string, data: Row): Row {
  const row: Row = { ...data };
  if (!row.id) row.id = newId(ID_PREFIX[model] || model.slice(0, 3));
  if (!(row.createdAt instanceof Date)) row.createdAt = new Date();
  row.updatedAt = new Date();
  return row;
}

// ============================================================================
// کلاینت نمایشی
// ============================================================================

export type DemoClient = any;

export function createMockClient(tables: Tables): DemoClient {
  const client: DemoClient = {};

  for (const model of MODELS) {
    const table = (): Row[] => (tables[model] ||= []);

    client[model] = {
      findMany: async (args: any = {}) => runQuery(tables, model, args),

      findFirst: async (args: any = {}) => runQuery(tables, model, args)[0] ?? null,

      findUnique: async (args: any = {}) => runQuery(tables, model, args)[0] ?? null,

      findFirstOrThrow: async (args: any = {}) => {
        const row = runQuery(tables, model, args)[0];
        if (!row) throw new Error(`No ${model} found`);
        return row;
      },

      findUniqueOrThrow: async (args: any = {}) => {
        const row = runQuery(tables, model, args)[0];
        if (!row) throw new Error(`No ${model} found`);
        return row;
      },

      count: async (args: any = {}) => {
        const rows = table().filter((r) => matchWhere(tables, model, r, args.where));
        return rows.length;
      },

      aggregate: async (args: any = {}) => {
        const rows = table().filter((r) => matchWhere(tables, model, r, args.where));
        const out: Row = { _count: rows.length };
        for (const op of ["_sum", "_avg", "_min", "_max"]) {
          const spec = args[op];
          if (!spec) continue;
          const result: Row = {};
          for (const field of Object.keys(spec)) {
            const values = rows.map((r) => numOf(r[field])).filter((n) => !isNaN(n));
            if (values.length === 0) {
              result[field] = op === "_sum" ? 0 : null;
            } else if (op === "_sum") {
              result[field] = values.reduce((a, b) => a + b, 0);
            } else if (op === "_avg") {
              result[field] = values.reduce((a, b) => a + b, 0) / values.length;
            } else if (op === "_min") {
              result[field] = Math.min(...values);
            } else {
              result[field] = Math.max(...values);
            }
          }
          out[op] = result;
        }
        return out;
      },

      groupBy: async (args: any = {}) => {
        const rows = table().filter((r) => matchWhere(tables, model, r, args.where));
        const by = Array.isArray(args.by) ? args.by : [args.by];
        const groups = new Map<string, Row[]>();
        for (const row of rows) {
          const key = by.map((f: string) => String(row[f])).join("|");
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key)!.push(row);
        }
        const result: Row[] = [];
        for (const group of groups.values()) {
          const entry: Row = {};
          for (const field of by) entry[field] = group[0][field];
          if (args._count) {
            // مثل Prisma: با `_count: true` یک عدد و با `_count: { field: true }`
            // یک شیء از شمارش‌ها برگردانده می‌شود.
            if (args._count === true) {
              entry._count = group.length;
            } else {
              const counts: Row = {};
              for (const field of Object.keys(args._count)) counts[field] = group.length;
              entry._count = counts;
            }
          }
          for (const op of ["_sum", "_avg", "_min", "_max"]) {
            if (!args[op]) continue;
            const agg: Row = {};
            for (const field of Object.keys(args[op])) {
              const values = group.map((r) => numOf(r[field]));
              agg[field] =
                op === "_sum"
                  ? values.reduce((a, b) => a + b, 0)
                  : op === "_avg"
                    ? values.reduce((a, b) => a + b, 0) / (values.length || 1)
                    : op === "_min"
                      ? Math.min(...values)
                      : Math.max(...values);
            }
            entry[op] = agg;
          }
          result.push(entry);
        }
        if (args.orderBy) return sortRows(tables, model, result, args.orderBy);
        return result;
      },

      create: async (args: any = {}) => {
        const row = materialize(model, args.data || {});
        table().push(row);
        return project(tables, model, row, args, 0);
      },

      createMany: async (args: any = {}) => {
        const items = Array.isArray(args.data) ? args.data : [args.data];
        for (const item of items) table().push(materialize(model, item));
        return { count: items.length };
      },

      update: async (args: any = {}) => {
        const rows = table();
        const index = rows.findIndex((r) => matchWhere(tables, model, r, args.where));
        if (index === -1) {
          // در پیش‌نمایش، به‌جای خطا یک رکورد ساختگی برمی‌گردانیم تا UI نشکند
          return project(
            tables,
            model,
            materialize(model, { ...(args.data || {}), ...(args.where || {}) }),
            args,
            0
          );
        }
        applyData(rows[index], args.data || {});
        rows[index].updatedAt = new Date();
        return project(tables, model, rows[index], args, 0);
      },

      updateMany: async (args: any = {}) => {
        const rows = table().filter((r) => matchWhere(tables, model, r, args.where));
        for (const row of rows) {
          applyData(row, args.data || {});
          row.updatedAt = new Date();
        }
        return { count: rows.length };
      },

      upsert: async (args: any = {}) => {
        const rows = table();
        const existing = rows.find((r) => matchWhere(tables, model, r, args.where));
        if (existing) {
          applyData(existing, args.update || {});
          return project(tables, model, existing, args, 0);
        }
        const row = materialize(model, { ...(args.where || {}), ...(args.create || {}) });
        rows.push(row);
        return project(tables, model, row, args, 0);
      },

      delete: async (args: any = {}) => {
        const rows = table();
        const index = rows.findIndex((r) => matchWhere(tables, model, r, args.where));
        if (index === -1) return null;
        const [removed] = rows.splice(index, 1);
        return project(tables, model, removed, args, 0);
      },

      deleteMany: async (args: any = {}) => {
        const rows = table();
        const keep = rows.filter((r) => !matchWhere(tables, model, r, args.where));
        const count = rows.length - keep.length;
        tables[model] = keep;
        return { count };
      },
    };
  }

  client.$transaction = async (arg: any) =>
    typeof arg === "function" ? arg(client) : Promise.all(Array.isArray(arg) ? arg : [arg]);
  client.$connect = async () => undefined;
  client.$disconnect = async () => undefined;
  client.$queryRaw = async () => [];
  client.$executeRaw = async () => 0;
  client.$queryRawUnsafe = async () => [];
  client.$executeRawUnsafe = async () => 0;
  client.$on = () => undefined;
  client.$use = () => undefined;

  return client;
}
