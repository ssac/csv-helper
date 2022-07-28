import type {
	Options
} from 'csv-parse';

import type {
	FileOpts,
	FileWriteResponse
} from './file';

import Collection, {
	CellTransformer,
	CollectionWriteResponse
} from './collection';

export interface DbLikeOpts<K> {
	idField: K
}

export interface DbLikeArgs<K> {
	fileOpts: FileOpts
	dbLikeOpts: DbLikeOpts<K>
	parserOpts?: Options
}

export type RowData<K extends string> = {
	[id in K]: string
} & {
	[key: string]: string
}

/**
 * DB Like class is used to handle objects with unique key (e.g. id filed)
 */
export default class<K extends string, T extends RowData<K>> extends Collection<T> {
	private opts: DbLikeOpts<K>

	constructor(args: DbLikeArgs<K>) {
		super({
			fileOpts: args.fileOpts,
			parserOpts: args.parserOpts
		});

		this.opts = args.dbLikeOpts;
	}

	public async getRowById({
		idValue
	}: {
		idValue: string
	}): Promise<T> {
		const rows = await this.filter({
			query: {[this.opts.idField]: idValue},
			once: true
		});

		if (rows.length > 0) {
			return rows[0];
		}

		return null;
	}

	public async getCellById({
		idValue,
		targetField
	}: {
		idValue: string;
		targetField: string
	}): Promise<string> {
		const row = await this.getRowById({
			idValue
		});

		if (!row) {
			return null;
		}

		return row[targetField];
	}

	public async editFieldById({
		idValue,
		field,
		value,
		isSaveOnDone = true,
	}: {
		idValue: string
		field: string
		value?: CellTransformer<T>
		isSaveOnDone: boolean
	}): Promise<CollectionWriteResponse<T>> {
		return this.loop({
			query: {[this.opts.idField]: idValue},
			transformer: async ({row, rows}) => {
				return {
					...row,
					[field]: await this.transformCell(value, {
						row,
						rows
					})
				}
			},
			isSaveOnDone,
			isSaveOnError: false
		});
	}
}