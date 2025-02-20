import {
	FacetCount as ProtoFacetCount,
	FacetStats as ProtoFacetStats,
	Page as ProtoSearchPage,
	SearchFacet as ProtoSearchFacet,
	SearchHit as ProtoSearchHit,
	SearchHitMeta as ProtoSearchHitMeta,
	SearchMetadata as ProtoSearchMetadata,
	SearchResponse as ProtoSearchResponse,
	Match as ProtoMatch,
} from "../proto/server/v1/api_pb";
import { SearchIndexResponse as ProtoSearchIndexResponse } from "../proto/server/v1/search_pb";
import { TigrisClientConfig } from "../tigris";
import { TigrisCollectionType } from "../types";
import { Utility } from "../utility";

export type Facets = { [key: string]: FacetCountDistribution };

/**
 * Outcome of executing search query
 * @typeParam T - type of Tigris collection
 */
export class SearchResult<T> {
	private readonly _hits: ReadonlyArray<IndexedDoc<T>>;
	private readonly _facets: Facets;
	private readonly _meta: SearchMeta | undefined;

	constructor(hits: Array<IndexedDoc<T>>, facets: Facets, meta: SearchMeta | undefined) {
		this._hits = hits;
		this._facets = facets;
		this._meta = meta;
	}

	static get empty(): SearchResult<never> {
		return new SearchResult([], {}, SearchMeta.default);
	}

	/**
	 * @returns matched documents as a list
	 * @readonly
	 */
	get hits(): ReadonlyArray<IndexedDoc<T>> {
		return this._hits;
	}

	/**
	 * @returns distribution of facets for fields included in facet query
	 * @readonly
	 */
	get facets(): { [key: string]: FacetCountDistribution } {
		return this._facets;
	}

	/**
	 * @returns metadata associated with {@link SearchResult}
	 * @readonly
	 * @defaultValue undefined
	 */
	get meta(): SearchMeta | undefined {
		return this._meta;
	}

	static from<T>(
		resp: ProtoSearchResponse | ProtoSearchIndexResponse,
		config: TigrisClientConfig
	): SearchResult<T> {
		const _meta =
			typeof resp?.getMeta() !== "undefined" ? SearchMeta.from(resp.getMeta()) : SearchMeta.default;
		const _hits: Array<IndexedDoc<T>> = resp
			.getHitsList()
			.map((h: ProtoSearchHit) => IndexedDoc.from<T>(h, config));
		const _facets: Facets = {};
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		for (const [k, _] of resp.getFacetsMap().toArray()) {
			_facets[k] = FacetCountDistribution.from(resp.getFacetsMap().get(k));
		}
		return new SearchResult(_hits, _facets, _meta);
	}
}

/**
 * Matched document and relevance metadata for a search query
 * @typeParam T - type of Tigris collection
 */
export class IndexedDoc<T extends TigrisCollectionType> {
	private readonly _document: T;
	private readonly _meta: DocMeta | undefined;

	constructor(document: T, meta: DocMeta | undefined) {
		this._document = document;
		this._meta = meta;
	}

	/**
	 * @returns json deserialized collection document
	 * @readonly
	 */
	get document(): T {
		return this._document;
	}

	/**
	 * @returns relevance metadata for the matched document
	 * @readonly
	 */
	get meta(): DocMeta | undefined {
		return this._meta;
	}

	static from<T>(resp: ProtoSearchHit, config: TigrisClientConfig): IndexedDoc<T> {
		const docAsB64 = resp.getData_asB64();
		const document = Utility.jsonStringToObj<T>(Utility._base64Decode(docAsB64), config);
		const meta = resp.hasMetadata() ? DocMeta.from(resp.getMetadata()) : undefined;
		return new IndexedDoc<T>(document, meta);
	}
}

/**
 * Relevance metadata for a matched document
 */
export class DocMeta {
	private readonly _createdAt: Date | undefined;
	private readonly _updatedAt: Date | undefined;
	private readonly _textMatch: TextMatchInfo | undefined;

	constructor(createdAt: Date, updatedAt: Date, textMatch: TextMatchInfo) {
		this._createdAt = createdAt;
		this._updatedAt = updatedAt;
		this._textMatch = textMatch;
	}

	/**
	 * @returns time at which document was inserted/replaced to a precision of milliseconds
	 * @readonly
	 */
	get createdAt(): Date | undefined {
		return this._createdAt;
	}

	/**
	 * @returns time at which document was updated to a precision of milliseconds
	 * @readonly
	 */
	get updatedAt(): Date | undefined {
		return this._updatedAt;
	}

	/**
	 * @returns metadata for matched fields and relevant score
	 */
	get textMatch(): TextMatchInfo {
		return this._textMatch;
	}

	static from(resp: ProtoSearchHitMeta): DocMeta {
		const _createdAt =
			typeof resp?.getCreatedAt()?.getSeconds() !== "undefined"
				? new Date(resp.getCreatedAt().getSeconds() * 1000)
				: undefined;
		const _updatedAt =
			typeof resp?.getUpdatedAt()?.getSeconds() !== "undefined"
				? new Date(resp.getUpdatedAt().getSeconds() * 1000)
				: undefined;
		const _textMatch =
			typeof resp?.getMatch() !== "undefined" ? TextMatchInfo.from(resp.getMatch()) : undefined;

		return new DocMeta(_createdAt, _updatedAt, _textMatch);
	}
}

/**
 * Information about the matched document
 */
export class TextMatchInfo {
	private readonly _fields: ReadonlyArray<string>;
	private readonly _score: string;

	get fields(): ReadonlyArray<string> {
		return this._fields;
	}

	get score(): string {
		return this._score;
	}

	constructor(fields: ReadonlyArray<string>, score: string) {
		this._fields = fields;
		this._score = score;
	}

	static from(resp: ProtoMatch): TextMatchInfo {
		const matchFields: Array<string> = resp.getFieldsList().map((f) => f.getName());
		return new TextMatchInfo(matchFields, resp.getScore());
	}
}

/**
 * Distribution of values in a faceted field
 */
class FacetCountDistribution {
	private readonly _counts: ReadonlyArray<FacetCount>;
	private readonly _stats: FacetStats | undefined;

	constructor(counts: ReadonlyArray<FacetCount>, stats: FacetStats | undefined) {
		this._counts = counts;
		this._stats = stats;
	}

	/**
	 * @returns list of field values and their aggregated counts
	 * @readonly
	 */
	get counts(): ReadonlyArray<FacetCount> {
		return this._counts;
	}

	/**
	 * @returns summary of faceted field
	 * @readonly
	 */
	get stats(): FacetStats | undefined {
		return this._stats;
	}

	static from(resp: ProtoSearchFacet): FacetCountDistribution {
		const stats =
			typeof resp?.getStats() !== "undefined" ? FacetStats.from(resp.getStats()) : undefined;
		const counts = resp.getCountsList().map((c) => FacetCount.from(c));
		return new FacetCountDistribution(counts, stats);
	}
}

/**
 * Aggregate count of values in a faceted field
 */
export class FacetCount {
	private readonly _value: string;
	private readonly _count: number;

	constructor(value: string, count: number) {
		this._value = value;
		this._count = count;
	}

	/**
	 * @returns field's attribute value
	 * @readonly
	 */
	get value(): string {
		return this._value;
	}

	/**
	 * @returns count of field values in the search results
	 * @readonly
	 */
	get count(): number {
		return this._count;
	}

	static from(resp: ProtoFacetCount): FacetCount {
		return new FacetCount(resp.getValue(), resp.getCount());
	}
}

/**
 * Summary of field values in a faceted field
 */
export class FacetStats {
	private readonly _avg: number;
	private readonly _count: number;
	private readonly _max: number;
	private readonly _min: number;
	private readonly _sum: number;

	constructor(avg: number, count: number, max: number, min: number, sum: number) {
		this._avg = avg;
		this._count = count;
		this._max = max;
		this._min = min;
		this._sum = sum;
	}

	/**
	 * Only for numeric fields. Average of values in a numeric field
	 *
	 * @returns average of values in a numeric field
	 * @defaultValue `0`
	 * @readonly
	 */
	get avg(): number {
		return this._avg;
	}

	/**
	 * @returns Count of values in a faceted field
	 * @readonly
	 */
	get count(): number {
		return this._count;
	}

	/**
	 * Only for numeric fields. Maximum value in a numeric field
	 *
	 * @returns maximum value in a numeric field
	 * @defaultValue `0`
	 * @readonly
	 */
	get max(): number {
		return this._max;
	}

	/**
	 * Only for numeric fields. Minimum value in a numeric field
	 *
	 * @returns minimum value in a numeric field
	 * @defaultValue `0`
	 * @readonly
	 */
	get min(): number {
		return this._min;
	}

	/**
	 * Only for numeric fields. Sum of numeric values in the field
	 *
	 * @returns sum of numeric values in the field
	 * @defaultValue `0`
	 * @readonly
	 */
	get sum(): number {
		return this._sum;
	}

	static from(resp: ProtoFacetStats): FacetStats {
		return new FacetStats(
			resp?.getAvg() ?? 0,
			resp?.getCount() ?? 0,
			resp?.getMax() ?? 0,
			resp?.getMin() ?? 0,
			resp?.getSum() ?? 0
		);
	}
}

/**
 * Metadata associated with search results
 */
export class SearchMeta {
	private readonly _found: number;
	private readonly _totalPages: number;
	private readonly _page: Page;
	private readonly _matchedFields: ReadonlyArray<string>;

	constructor(found: number, totalPages: number, page: Page, matchedFields: Array<string>) {
		this._found = found;
		this._totalPages = totalPages;
		this._page = page;
		this._matchedFields = matchedFields;
	}

	/**
	 * @returns total number of matched hits for search query
	 * @readonly
	 */
	get found(): number {
		return this._found;
	}

	/**
	 * @returns total number of pages of search results
	 * @readonly
	 */
	get totalPages(): number {
		return this._totalPages;
	}

	/**
	 * @returns current page information
	 * @readonly
	 */
	get page(): Page {
		return this._page;
	}

	/**
	 * @returns List of document fields matching the given input
	 * @readonly
	 */
	get matchedFields(): ReadonlyArray<string> {
		return this._matchedFields;
	}

	static from(resp: ProtoSearchMetadata): SearchMeta {
		const found = resp?.getFound() ?? 0;
		const totalPages = resp?.getTotalPages() ?? 0;
		const page = typeof resp?.getPage() !== "undefined" ? Page.from(resp.getPage()) : undefined;
		return new SearchMeta(found, totalPages, page, resp.getMatchedFieldsList());
	}

	/**
	 * @returns default metadata to construct empty/default response
	 * @readonly
	 */
	static get default(): SearchMeta {
		return new SearchMeta(0, 1, Page.default, []);
	}
}

/**
 * Pagination metadata associated with search results
 */
export class Page {
	private readonly _current;
	private readonly _size;

	constructor(current, size) {
		this._current = current;
		this._size = size;
	}

	/**
	 * @returns current page number for the paginated search results
	 * @readonly
	 */
	get current() {
		return this._current;
	}

	/**
	 * @returns maximum number of search results included per page
	 * @readonly
	 */
	get size() {
		return this._size;
	}

	static from(resp: ProtoSearchPage): Page {
		const current = resp?.getCurrent() ?? 0;
		const size = resp?.getSize() ?? 0;
		return new Page(current, size);
	}

	/**
	 * @returns the pre-defined page number and size to construct a default response
	 * @readonly
	 */
	static get default(): Page {
		return new Page(1, 20);
	}
}
