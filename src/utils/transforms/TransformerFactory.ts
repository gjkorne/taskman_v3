import { DataTransformer, TransformerFactory as ITransformerFactory } from './DataTransformer';
import { TaskApiDto } from '../../types/api/taskDto';
import { TaskModel } from '../../types/models/TaskModel';
import { taskTransformer } from './TaskTransformer';
import { AppError, ErrorType } from '../errorHandling';

/**
 * Centralized factory for accessing data transformers
 * Manages transformer instances and provides a consistent way to get transformers
 */
export class TransformerFactory implements ITransformerFactory {
  private static instance: TransformerFactory;
  private transformers: Map<string, DataTransformer<any, any>> = new Map();
  
  /**
   * Private constructor to prevent direct instantiation
   * Initialize with default transformers
   */
  private constructor() {
    this.registerDefaultTransformers();
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): TransformerFactory {
    if (!TransformerFactory.instance) {
      TransformerFactory.instance = new TransformerFactory();
    }
    return TransformerFactory.instance;
  }
  
  /**
   * Register default transformers
   */
  private registerDefaultTransformers(): void {
    // Register task transformer
    this.registerTransformer('task', taskTransformer);
    
    // Additional transformers will be added here as they are implemented
    // this.registerTransformer('timeSession', timeSessionTransformer);
    // this.registerTransformer('category', categoryTransformer);
  }
  
  /**
   * Register a transformer
   */
  public registerTransformer<A, M>(
    type: string, 
    transformer: DataTransformer<A, M>
  ): void {
    this.transformers.set(type.toLowerCase(), transformer);
  }
  
  /**
   * Get a transformer for a specific entity type
   */
  public getTransformer<A, M>(type: string): DataTransformer<A, M> {
    const transformer = this.transformers.get(type.toLowerCase());
    
    if (!transformer) {
      throw new AppError(
        ErrorType.NOT_FOUND,
        `Transformer not found for type: ${type}`,
        { code: 'TRANSFORMER_NOT_FOUND' }
      );
    }
    
    return transformer as DataTransformer<A, M>;
  }
  
  /**
   * Get the task transformer
   */
  public getTaskTransformer(): DataTransformer<TaskApiDto, TaskModel> {
    return this.getTransformer<TaskApiDto, TaskModel>('task');
  }
}

// Export singleton instance
export const transformerFactory = TransformerFactory.getInstance();
