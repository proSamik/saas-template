/**
 * Type declarations for form-related libraries to resolve linting errors
 */

declare module 'react-hook-form' {
  export type FieldValues = Record<string, any>;
  
  export type UseFormProps<TFieldValues extends FieldValues = FieldValues> = {
    resolver?: any;
    defaultValues?: Partial<TFieldValues>;
    mode?: 'onSubmit' | 'onChange' | 'onBlur' | 'onTouched' | 'all';
  };
  
  export type UseFormReturn<TFieldValues extends FieldValues = FieldValues> = {
    control: {
      _names: {
        focus: string;
        mount: string;
      };
    };
    register: (name: string) => {
      onChange: (e: any) => void;
      onBlur: (e: any) => void;
      name: string;
      ref: (e: any) => void;
    };
    handleSubmit: (onSubmit: (data: TFieldValues) => void) => (e: any) => void;
    reset: (values?: Partial<TFieldValues>) => void;
  };
  
  export function useForm<TFieldValues extends FieldValues = FieldValues>(props?: UseFormProps<TFieldValues>): UseFormReturn<TFieldValues>;
}

declare module '@hookform/resolvers/zod' {
  export function zodResolver(schema: any): any;
}

declare module 'date-fns' {
  export function format(date: Date | number, format: string, options?: any): string;
}

declare module 'zod' {
  export interface ZodType<Output = any> {
    _output: Output;
  }

  export interface ZodString extends ZodType<string> {
    min(length: number, message?: string): ZodString;
    optional(): ZodOptional<ZodString>;
  }

  export interface ZodNumber extends ZodType<number> {
    int(): ZodNumber;
    positive(message?: string): ZodNumber;
    optional(): ZodOptional<ZodNumber>;
  }

  export interface ZodBoolean extends ZodType<boolean> {
    default(value: boolean): ZodDefault<ZodBoolean>;
  }

  export interface ZodDate extends ZodType<Date> {
    optional(): ZodOptional<ZodDate>;
  }

  export interface ZodEnumType<T extends readonly [string, ...string[]]> extends ZodType<T[number]> {}

  export interface ZodObject<T> extends ZodType<T> {
    refine(refinement: (data: any) => boolean, options: { message: string; path: string[] }): ZodObject<T>;
  }

  export interface ZodOptional<T extends ZodType<any>> extends ZodType<T['_output'] | undefined> {}
  export interface ZodDefault<T extends ZodType<any>> extends ZodType<T['_output']> {}

  export function object<T extends Record<string, any>>(shape: T): ZodObject<T>;
  export function string(): ZodString;
  export function number(): ZodNumber;
  export function boolean(): ZodBoolean;
  export function date(): ZodDate;
  export function enumType<T extends readonly [string, ...string[]]>(values: T): ZodEnumType<T>;

  export type infer<T extends ZodType<any>> = T['_output'];

  export const z: {
    object: typeof object;
    string: typeof string;
    number: typeof number;
    boolean: typeof boolean;
    date: typeof date;
    enum: typeof enumType;
    infer: typeof infer;
  };
} 