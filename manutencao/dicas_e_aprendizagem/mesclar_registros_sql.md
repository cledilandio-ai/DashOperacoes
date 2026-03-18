# Como Mesclar e Limpar Registros Duplicados no SQL

Sempre que o banco de dados tiver registros repetidos ou duplicações e precisamos arrumar as coisas sem quebrar as dependências (chaves estrangeiras), a lógica necessária é sempre:

**Transferir os filhos ➔ Ajustar o pai ➔ Excluir a sobra**

Ao deletar o ID principal (o que sobra) precocemente, o banco devolve um erro bloqueando a execução porque haviam registros órfãos que precisam que aquilo exista.

## Exemplo Prático de Mesclagem de Setores

Tivemos o caso da importação onde o sistema extraiu "CAFE" com Idioma diferente de "CAFÉ", criando o ID 15 e ID 22 do banco de dados na importação.
Para mesclar eles de forma segura unindo tudo no 15 (certo) e matando o 22 (errado):

```sql
-- 1. Mover as MÁQUINAS do setor errado (22) para o setor certo (15)
UPDATE public.maquinas 
SET setor_id = 15 
WHERE setor_id = 22;

-- 2. Mover os EQUIPAMENTOS soltos do setor errado para o certo
UPDATE public.equipamentos 
SET setor_id = 15 
WHERE setor_id = 22;

-- 3. Mover os SUB-SETORES (caso o setor 22 tivesse algum setor "filho")
UPDATE public.setores 
SET pai_id = 15 
WHERE pai_id = 22;

-- 4. Arrumar o nome do setor que ficou (ID 15) para o padrão correto
UPDATE public.setores 
SET nome = 'CAFÉ' 
WHERE id = 15;

-- 5. Excluir o setor 22 (agora que ele não tem mais nenhuma máquina apontando para ele)
DELETE FROM public.setores 
WHERE id = 22;
```

### Dica de Ouro 💡
Sempre que for fazer um `UPDATE` ou `DELETE` no banco, **nunca esqueça a cláusula `WHERE`**. Se você rodar `DELETE FROM public.setores;` sem o `WHERE id = 22`, você zera a tabela inteira e exclui todos os setores da sua máquina!
