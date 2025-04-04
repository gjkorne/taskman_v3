/**
 * Base interface for transforming data between API DTOs and application models
 * Provides a standardized approach to handle data conversion
 */
export interface DataTransformer<TApiDto, TModel> {
  /**
   * Convert API DTO to application model
   */
  toModel(apiData: TApiDto): TModel;
  
  /**
   * Convert application model to API DTO
   */
  toApi(model: TModel): TApiDto;
  
  /**
   * Convert an array of API DTOs to an array of models
   * @param apiDataArray Array of API/database data
   * @returns Array of model objects
   */
  toModelArray(apiDataArray: TApiDto[]): TModel[];
  
  /**
   * Convert an array of models to an array of API DTOs
   * @param modelDataArray Array of application model objects
   * @returns Array of API/database data
   */
  toApiArray(modelDataArray: TModel[]): TApiDto[];
  
  /**
   * Convert model to a create DTO format
   */
  toCreateDto(model: TModel): any;
}

/**
 * Abstract base class for data transformers
 * Implements common functionality for array transformations
 */
export abstract class BaseDataTransformer<TApiDto, TModel> implements DataTransformer<TApiDto, TModel> {
  /**
   * Abstract method to be implemented by concrete transformers
   */
  abstract toModel(apiData: TApiDto): TModel;
  
  /**
   * Abstract method to be implemented by concrete transformers
   */
  abstract toApi(model: TModel): TApiDto;
  
  /**
   * Convert model to a create DTO format
   * This method should be implemented by specific transformers
   */
  abstract toCreateDto(model: TModel): any;
  
  /**
   * Convert an array of API DTOs to an array of models
   */
  toModelArray(apiDataArray: TApiDto[]): TModel[] {
    if (!apiDataArray) return [];
    return apiDataArray.map(item => this.toModel(item));
  }
  
  /**
   * Convert an array of models to an array of API DTOs
   */
  toApiArray(modelDataArray: TModel[]): TApiDto[] {
    if (!modelDataArray) return [];
    return modelDataArray.map(item => this.toApi(item));
  }
}

/**
 * Factory interface for creating transformers
 */
export interface TransformerFactory {
  /**
   * Get a transformer for a specific model type
   * @param type The model/entity type
   * @returns A transformer instance
   */
  getTransformer<A, M>(type: string): DataTransformer<A, M>;
}
