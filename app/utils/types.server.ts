export type RegisterForm = {
    email: string,
    password: string,
    firstName: string,
    lastName: string
}

export type LoginForm = {
    email: string,
    password: string,
}

export interface FormError {
	error?: string;
	errors?: {
		email?: string;
		password?: string;
		firstName?: string;
		lastName?: string;
	};
	fields?: {
		email?: string;
		password?: string;
		firstName?: string;
		lastName?: string;
		department?: string;
		profilePicture?: string;
	};
	form?: string;
}