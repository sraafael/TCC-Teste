from pydantic import BaseModel, Field, validator, EmailStr, root_validator
from typing import Optional, List
import re


class AlunoCreate(BaseModel):
    nome: str = Field(..., min_length=3, max_length=100)
    cpf: str
    telefone: str
    email: EmailStr
    idade: int = Field(..., ge=12, le=120)
    peso: float = Field(..., gt=19.9, lt=400.1)
    plano: str = Field(..., min_length=2, max_length=50)

    @validator('cpf', pre=True)
    def cpf_digits(cls, v):
        digits = re.sub(r'\D', '', str(v or ''))
        if len(digits) != 11:
            raise ValueError('CPF invalido')
        return digits

    @validator('telefone', pre=True)
    def telefone_digits(cls, v):
        digits = re.sub(r'\D', '', str(v or ''))
        if len(digits) not in (10, 11):
            raise ValueError('Telefone invalido')
        return digits


class AlunoUpdate(BaseModel):
    nome: Optional[str]
    telefone: Optional[str]
    email: Optional[EmailStr]
    idade: Optional[int]
    peso: Optional[float]
    plano: Optional[str]
    status: Optional[str]
    pagamento: Optional[str]

    @validator('idade')
    def idade_range(cls, v):
        if v is None:
            return v
        if not (12 <= v <= 120):
            raise ValueError('Idade invalida')
        return v

    @validator('peso')
    def peso_range(cls, v):
        if v is None:
            return v
        if not (20 <= v <= 400):
            raise ValueError('Peso invalido')
        return v


class ProfessorCreate(BaseModel):
    nome: str = Field(..., min_length=3, max_length=100)
    cpf: str
    telefone: str
    email: EmailStr
    horario: str
    salario: float = Field(..., gt=0)
    especialidade: str = Field(..., min_length=3, max_length=60)

    @validator('cpf', pre=True)
    def cpf_digits(cls, v):
        digits = re.sub(r'\D', '', str(v or ''))
        if len(digits) != 11:
            raise ValueError('CPF invalido')
        return digits

    @validator('telefone', pre=True)
    def telefone_digits(cls, v):
        digits = re.sub(r'\D', '', str(v or ''))
        if len(digits) not in (10, 11):
            raise ValueError('Telefone invalido')
        return digits

    @validator('horario')
    def horario_format(cls, v):
        if not re.fullmatch(r'([01]\d|2[0-3]):[0-5]\d\s*-\s*([01]\d|2[0-3]):[0-5]\d', v or ''):
            raise ValueError('Horario invalido. Use HH:MM - HH:MM')
        return v


class ProfessorUpdate(BaseModel):
    nome: Optional[str]
    telefone: Optional[str]
    email: Optional[EmailStr]
    horario: Optional[str]
    salario: Optional[float]
    especialidade: Optional[str]
    status: Optional[str]

    @validator('salario')
    def salario_positive(cls, v):
        if v is None:
            return v
        if v <= 0:
            raise ValueError('Salario invalido')
        return v


class PlanoBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    price: float = Field(..., gt=0)
    duration: str = Field(..., min_length=1)
    modalities: Optional[List[str]] = None
    benefits: Optional[List[str]] = None
    active: Optional[bool] = True

    @root_validator(pre=True)
    def map_aliases(cls, values):
        if 'nome' in values and 'name' not in values:
            values['name'] = values.pop('nome')
        if 'preco' in values and 'price' not in values:
            values['price'] = values.pop('preco')
        if 'duracao' in values and 'duration' not in values:
            values['duration'] = values.pop('duracao')
        if 'modalidades' in values and 'modalities' not in values:
            values['modalities'] = values.pop('modalidades')
        if 'beneficios' in values and 'benefits' not in values:
            values['benefits'] = values.pop('beneficios')
        if 'ativo' in values and 'active' not in values:
            values['active'] = values.pop('ativo')
        return values


class PlanoCreate(PlanoBase):
    pass


class PlanoUpdate(BaseModel):
    name: Optional[str]
    price: Optional[float]
    duration: Optional[str]
    modalities: Optional[List[str]]
    benefits: Optional[List[str]]
    active: Optional[bool]

    @root_validator(pre=True)
    def map_aliases_update(cls, values):
        if 'nome' in values and 'name' not in values:
            values['name'] = values.pop('nome')
        if 'preco' in values and 'price' not in values:
            values['price'] = values.pop('preco')
        if 'duracao' in values and 'duration' not in values:
            values['duration'] = values.pop('duracao')
        if 'modalidades' in values and 'modalities' not in values:
            values['modalities'] = values.pop('modalidades')
        if 'beneficios' in values and 'benefits' not in values:
            values['benefits'] = values.pop('beneficios')
        if 'ativo' in values and 'active' not in values:
            values['active'] = values.pop('ativo')
        return values


class TurmaCreate(BaseModel):
    event: str = Field(..., min_length=3, max_length=100)
    time: str
    room: str = Field(..., min_length=1, max_length=50)
    professor: str = Field(..., min_length=3)
    capacity: int = Field(..., gt=0, lt=101)

    @validator('time')
    def time_format(cls, v):
        if not re.fullmatch(r'([01]\d|2[0-3]):[0-5]\d', v or ''):
            raise ValueError('Horario invalido. Use HH:MM')
        return v

    @root_validator(pre=True)
    def map_aliases(cls, values):
        if 'evento' in values and 'event' not in values:
            values['event'] = values.pop('evento')
        if 'horario' in values and 'time' not in values:
            values['time'] = values.pop('horario')
        if 'sala' in values and 'room' not in values:
            values['room'] = values.pop('sala')
        if 'capacidade' in values and 'capacity' not in values:
            values['capacity'] = values.pop('capacidade')
        return values


class TurmaUpdate(BaseModel):
    event: Optional[str]
    time: Optional[str]
    room: Optional[str]
    professor: Optional[str]
    capacity: Optional[int]

    @validator('time')
    def time_format(cls, v):
        if v is None:
            return v
        if not re.fullmatch(r'([01]\d|2[0-3]):[0-5]\d', v or ''):
            raise ValueError('Horario invalido. Use HH:MM')
        return v


class PaymentCreate(BaseModel):
    studentCpf: str
    studentName: str
    amount: float = Field(..., gt=0)
    paymentMethod: Optional[str] = Field('manual')
    paymentDate: Optional[str]
    reference: Optional[str]
    description: Optional[str]

    @validator('studentCpf', pre=True)
    def cpf_digits(cls, v):
        digits = re.sub(r'\D', '', str(v or ''))
        if len(digits) != 11:
            raise ValueError('CPF invalido')
        return digits

    @validator('paymentMethod')
    def method_allowed(cls, v):
        allowed = {'manual', 'dinheiro', 'pix', 'cartao-debito', 'cartao-credito'}
        if v is None:
            return 'manual'
        if v not in allowed:
            raise ValueError('Metodo de pagamento invalido')
        return v


class EntryCreate(BaseModel):
    description: str = Field(..., min_length=3)
    category: str = Field(..., min_length=1)
    amount: float = Field(..., gt=0)
    type: str = Field(...)

    @validator('type')
    def type_allowed(cls, v):
        if v not in ('receita', 'despesa'):
            raise ValueError('Tipo deve ser receita ou despesa')
        return v


class ReallocateStudent(BaseModel):
    studentCpf: str
    sourceClassId: str
    targetClassId: str

    @validator('studentCpf', pre=True)
    def cpf_digits(cls, v):
        digits = re.sub(r'\D', '', str(v or ''))
        if len(digits) != 11:
            raise ValueError('CPF invalido')
        return digits


class PayrollUpdate(BaseModel):
    adjusted_amount: Optional[float]
    due_date: Optional[str]
    status: Optional[str]
    notes: Optional[str]

    @root_validator(pre=True)
    def map_aliases(cls, values):
        # suportar chaves em portugues/alternativas
        if 'valor' in values and 'adjusted_amount' not in values:
            values['adjusted_amount'] = values.pop('valor')
        if 'vencimento' in values and 'due_date' not in values:
            values['due_date'] = values.pop('vencimento')
        if 'observacao' in values and 'notes' not in values:
            values['notes'] = values.pop('observacao')
        return values


class PlanReallocate(BaseModel):
    target_plan_id: int

    @validator('target_plan_id', pre=True)
    def to_int(cls, v):
        try:
            return int(str(v).strip())
        except Exception:
            raise ValueError('target_plan_id invalido')


class ForgotPasswordSchema(BaseModel):
    cpf: str
    role: Optional[str]

    @validator('cpf', pre=True)
    def cpf_digits(cls, v):
        digits = re.sub(r'\D', '', str(v or ''))
        if len(digits) != 11:
            raise ValueError('CPF invalido')
        return digits


class LoginSchema(BaseModel):
    cpf: str
    password: str
    role: Optional[str]

    @validator('cpf', pre=True)
    def cpf_digits(cls, v):
        digits = re.sub(r'\D', '', str(v or ''))
        if len(digits) != 11:
            raise ValueError('CPF invalido')
        return digits


class ResetPasswordSchema(BaseModel):
    cpf: str
    code: str
    new_password: str
    role: Optional[str]

    @validator('cpf', pre=True)
    def cpf_digits(cls, v):
        digits = re.sub(r'\D', '', str(v or ''))
        if len(digits) != 11:
            raise ValueError('CPF invalido')
        return digits

    @validator('code')
    def code_len(cls, v):
        if not (isinstance(v, str) and len(v) == 6 and v.isdigit()):
            raise ValueError('Codigo invalido. Use 6 digitos')
        return v

    @validator('new_password')
    def password_len(cls, v):
        if not (isinstance(v, str) and len(v) >= 6):
            raise ValueError('Senha muito curta. Minimo 6 caracteres')
        return v


class ProfessorVacation(BaseModel):
    action: str
    startDate: str
    endDate: str

    @validator('action')
    def action_allowed(cls, v):
        if v not in ['aprovada', 'reprovada', 'realocada', 'concedida']:
            raise ValueError('Acao invalida')
        return v

    @validator('startDate', 'endDate')
    def date_present(cls, v):
        if not v:
            raise ValueError('Data obrigatoria')
        return v
