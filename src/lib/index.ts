export function ReplacePlaceholders(template: string, replacements: { [key: string]: string }) {
	return template.replace(/{(\w+)}/g, (match, key) => replacements[key] || match);
}

function shuffleFisherYates(array: [string, string][]) {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
	return array;
}
