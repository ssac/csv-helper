import * as path from 'path';
import * as fs from 'fs';
import {
	parse
} from 'csv-parse/sync';

import {DbLike as Helper} from '../index';

function getContent (filePath: string) {
	return parse(fs.readFileSync(filePath), {
		bom: true,
		columns: true,
		skip_empty_lines: true,
		trim: true,
	})
}

const helper = new Helper<"name", {name: string, sex: 'M' | 'F', age: string}>({
	fileOpts: {
		filePath: path.resolve(__dirname, './test.csv')
	},
	dbLikeOpts: {
		idField: 'name'
	}
});

test('Test Helper.editFieldById(), isSaveOnDone=false', async () => {
	const changedResult = await helper.editFieldById({
		idValue: 'Peter',
		field: 'age',
		value: '25', // <===
		isSaveOnDone: false,
	});

	expect(changedResult.resultRows).toStrictEqual([{
		name: 'Peter',
		age: '25', // <===
		sex: 'M'
	}, {
		name: 'Sue',
		age: '16',
		sex: 'F'
	}]);

	const changedBySyncFunc = await helper.editFieldById({
		idValue: 'Peter',
		field: 'sex',
		value: ({row, rows}) => {
			return row.sex === 'F' ? 'M' : 'F'
		},
		isSaveOnDone: false,
	});

	expect(changedBySyncFunc.resultRows).toStrictEqual([{
		name: 'Peter',
		age: '18',
		sex: 'F' // <===
	}, {
		name: 'Sue',
		age: '16',
		sex: 'F'
	}]);

	// Test the async function to edit celll value
	const changeByAsyncFunc = await helper.editFieldById({
		idValue: 'Peter',
		field: 'sex',
		value: async ({row, rows}) => {
			return new Promise((resolve, reject) => {
				setTimeout(() => {
					resolve(row.sex === 'F' ? 'M' : 'F')
				}, 20);
			});
		},
		isSaveOnDone: false,
	});

	expect(changeByAsyncFunc.resultRows).toStrictEqual([{
		name: 'Peter',
		age: '18',
		sex: 'F' // <===
	}, {
		name: 'Sue',
		age: '16',
		sex: 'F'
	}]);
});

test('Test Helper.editFieldById(), isSaveOnDone=true', async () => {
	const changeByValue = await helper.editFieldById({
		idValue: 'Peter',
		field: 'age',
		value: '25', // <===
		isSaveOnDone: true,
	});

	const outputContent = getContent(changeByValue.outputPath);
	expect(outputContent).toStrictEqual(changeByValue.resultRows);
});