import { Users } from "generated/prisma";
import { ICriteria } from "src/utils/interfaces/filters-pagination";
import { CreateUserDto } from "../dtos/create-user.dto";

export abstract class UserRepository {
  abstract create(body: CreateUserDto): Promise<Users>;
  abstract findBy(param: ICriteria): Promise<Users | null>;
}