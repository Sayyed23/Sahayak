export type SecurityRuleContext = {
    path: string;
    operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write'; // Added write for transactions
    requestResourceData?: any;
};

export class FirestorePermissionError extends Error {
    public readonly context: SecurityRuleContext;

    constructor(context: SecurityRuleContext) {
        const message = `FirestoreError: Missing or insufficient permissions: The following request was denied by Firestore Security Rules:\n${JSON.stringify({
            auth: "/* The user's auth object will be injected here by the listener */",
            ...context
        }, null, 2)}`;
        
        super(message);
        this.name = 'FirestorePermissionError';
        this.context = context;

        // This is to ensure the instance of check works correctly
        Object.setPrototypeOf(this, FirestorePermissionError.prototype);
    }
}
