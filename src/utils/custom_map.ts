import { BaseCleanUp } from "./base_class/base_clean_up.ts";

export class CustomMap<T> extends BaseCleanUp {
	private _enableOverwrite: boolean = false;
	private map: Record<string | number, T> = {};
	private array: T[] = [];
	private count: number = 0;

	constructor() {
		super();
	}

	enableOverwrite(): this {
		this._enableOverwrite = true;
		return this;
	}

	disableOverwrite(): this {
		this._enableOverwrite = false;
		return this;
	}

	set(key: string | number, value: T): this {
		if (!this._enableOverwrite && this.has(key)) {
			throw new Error(`CustomMap 中键 ${key} 已存在，且禁止覆盖`);
		}
		if (this.has(key)) {
			const index = this.array.indexOf(this.map[key]);
			this.array[index] = this.map[key] = value;
		} else {
			this.map[key] = value;
			this.array.push(value);
			this.count++;
		}
		return this;
	}

	get(key: string | number): T | undefined {
		return this.map[key];
	}

	confirmedExistGet(key: string | number): T {
		if (this.has(key)) {
			return this.map[key];
		}
		throw new Error(`CustomMap 中键 ${key} 不存在`);
	}

	has(key: string | number): boolean {
		return Object.prototype.hasOwnProperty.call(this.map, key);
	}

	delete(key: string | number): this {
		if (this.has(key)) {
			const value = this.map[key];
			const index = this.array.indexOf(value);
			this.array.splice(index, 1);
			this.count--;
			delete this.map[key];
		}
		return this;
	}

	clear(): this {
		this.map = {};
		this.count = 0;
		this.array.length = 0;
		return this;
	}

	destroy(): void {
		this.clear();
		super.destroy();
	}
}
