export class BookEntity {
  id!: number;
  title!: string;
  author!: string;
  isbn!: string | null;     
  coverUrl!: string | null;  
  price!: number | null;     
  originalPrice!: number | null;
  categoryId!: number | null; 
  description!: string | null;
  language!: string | null;
  stock!: number;          
  salesCount!: number;    
  viewCount!: number;       
  rating!: number | null;    
  status!: number;         
  createdAt!: Date;        
  updatedAt!: Date;         
  deletedAt!: Date | null;  
  reading!: string | null;   
}