import { StreamLanguage } from '@codemirror/language';
import type { StreamParser } from '@codemirror/language';

// Parser for the IMGQL language
const imgqlParser: StreamParser<unknown> = {
	token: function (stream) {
		if (stream.match(/\b(let|load|save|print|import)\b/)) return 'keyword';

		if (stream.match(/"(?:[^\\"]|\\.)*"/)) return 'string';

		if (stream.match(/\b\d+\.?\d*\b|\b\.\d+\b/)) return 'number';

		if (stream.match(/\/\/.*$/)) return 'comment';

		if (stream.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b(?=\s*\()/)) return 'variable-2';

		if (stream.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/)) return 'variable';

		if (stream.match(/[=,()]/)) return 'operator';

		if (stream.eatSpace()) return null;

		stream.next();
		return null;
	},
};

export const imgql = () => StreamLanguage.define(imgqlParser);
