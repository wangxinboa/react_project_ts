export class BaseCleanUp {
	/** 标记是否已销毁，防止重复销毁 */
	private _destroyed = false;

	get isDestroyed(): boolean {
		return this._destroyed;
	}
	/**
	 * 销毁实例（清空所有自有属性并断开引用，释放内存）。
	 * 只能调用一次，重复调用会被忽略。
	 */
	protected destroy(): void {
		if (this._destroyed) {
			return;
		}
		const keys = Object.keys(this);
		for (let i = 0, len = keys.length; i < len; i++) {
			const key = keys[i];
			this.clearOwnProperty(key);
			delete (this as Record<string, unknown>)[key];
		}
		this._destroyed = true;
	}
	/**
	 * 清空单个自有属性。
	 * 抽出为独立方法，便于子类按需重写或过滤特定字段。
	 */
	private clearOwnProperty(key: string): void {
		(this as Record<string, unknown>)[key] = null;
	}
}
