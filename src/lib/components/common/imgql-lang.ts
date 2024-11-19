import { StreamLanguage } from '@codemirror/language';
import type { StreamParser } from '@codemirror/language';

const imgqlParser: StreamParser<unknown> = {
	token: function (stream) {
		// Keywords
		if (stream.match(/\b(let|load|save|print|import)\b/)) return 'keyword';

		// Strings
		if (stream.match(/"(?:[^\\"]|\\.)*"/)) return 'string';

		// Numbers
		if (stream.match(/\b\d+\.?\d*\b|\b\.\d+\b/)) return 'number';

		// Comments
		if (stream.match(/\/\/.*$/)) return 'comment';

		// Functions
		if (stream.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b(?=\s*\()/)) return 'variable-2';

		// Variables
		if (stream.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/)) return 'variable';

		// Operators
		if (stream.match(/[=,()]/)) return 'operator';

		// Move past any whitespace
		if (stream.eatSpace()) return null;

		// Skip unmatched character
		stream.next();
		return null;
	},
};

export const imgql = () => StreamLanguage.define(imgqlParser);
