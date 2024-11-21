export abstract class BaseViewModel {
	protected loading = $state(false);
	protected error = $state<string | null>(null);

	get isLoading() {
		return this.loading;
	}

	protected setLoading(value: boolean) {
		this.loading = value;
	}

	get currentError() {
		return this.error;
	}

	protected setError(message: string | null) {
		this.error = message;
	}
}
