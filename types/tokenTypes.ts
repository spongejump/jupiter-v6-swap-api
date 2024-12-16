export interface TokenInfo {
    name?: string;
    symbol?: string;
    address?: string;
    decimals?: number;
  }
  
  export interface TokenPrice {
    price?: number;
    price5m?: number;
    price1h?: number;
    price6h?: number;
    price24h?: number;
  }
  
  export interface TokenInfo2 {
    totalSupply?: string;
    mcap?: string;
    fdv?: string;
  }
  
  export interface RoutePlan {
    swapInfo: Record<string, any>; // Can be further typed if structure of swapInfo is known
    percent: number;
  }
  
  export interface QuoteResponse {
    inputMint: string;
    inAmount: string;
    outputMint: string;
    outAmount: string;
    otherAmountThreshold: string;
    swapMode: string;
    slippageBps: number;
    platformFee: string | null;
    priceImpactPct: string;
    routePlan: RoutePlan[];
    contextSlot: number;
    timeTaken: number;
  }
  
  export interface SwapInstructionsResponse {
    tokenLedgerInstruction: any | null;
    computeBudgetInstructions: ComputeBudgetInstruction[];
    setupInstructions: SetupInstruction[];
    swapInstruction: SwapInstruction;
    cleanupInstruction: CleanupInstruction;
    otherInstructions: any[]; // Can be further typed if needed
    addressLookupTableAddresses: string[];
    prioritizationFeeLamports: number;
    computeUnitLimit: number;
    prioritizationType: PrioritizationType;
    dynamicSlippageReport: any | null;
    simulationError: any | null;
  }
  
  export interface ComputeBudgetInstruction {
    programId: string;
    accounts: any[]; // Further typing may be needed for accounts
    data: string;
  }
  
  export interface SetupInstruction {
    programId: string;
    accounts: any[]; // Further typing may be needed for accounts
    data: string;
  }
  
  export interface SwapInstruction {
    programId: string;
    accounts: any[]; // Further typing may be needed for accounts
    data: string;
  }
  
  export interface CleanupInstruction {
    programId: string;
    accounts: any[]; // Further typing may be needed for accounts
    data: string;
  }
  
  export interface PrioritizationType {
    computeBudget: {
      microLamports: number;
      estimatedMicroLamports: number;
    };
  }
  