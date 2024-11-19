import { StreamLanguage } from '@codemirror/language';
import type { StreamParser } from '@codemirror/language';
import { styleTags, tags as t } from '@lezer/highlight';

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
		if (stream.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b(?=\s*\()/)) return 'function';

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

const imgqlLanguage = StreamLanguage.define(imgqlParser);

// Define highlighting styles
const imgqlHighlighting = styleTags({
	keyword: t.keyword,
	string: t.string,
	number: t.number,
	comment: t.lineComment,
	function: t.function(t.variableName),
	variable: t.variableName,
	operator: t.operator,
});

export const imgql = () => imgqlLanguage;
