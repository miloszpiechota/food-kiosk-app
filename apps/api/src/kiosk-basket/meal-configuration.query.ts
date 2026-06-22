import { Prisma } from '../../../../node_modules/@prisma/client/.prisma/client';

export const configurableMenuProductInclude = {
  product: {
    include: {
      modifierGroups: {
        include: {
          options: {
            where: { isAvailable: true },
            include: {
              ingredient: true,
              productIngredient: {
                include: {
                  ingredient: true,
                },
              },
            },
          },
        },
      },
      productGroups: {
        orderBy: [{ sortOrder: 'asc' as const }],
        include: {
          productGroupTemplate: true,
          options: {
            where: {
              isAvailable: true,
              product: {
                isAvailable: true,
              },
            },
            orderBy: [{ sortOrder: 'asc' as const }],
            include: {
              product: {
                include: {
                  modifierGroups: {
                    include: {
                      options: {
                        where: { isAvailable: true },
                        include: {
                          ingredient: true,
                          productIngredient: {
                            include: {
                              ingredient: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.MenuProductInclude;

export type ConfigurableMenuProduct = Prisma.MenuProductGetPayload<{
  include: typeof configurableMenuProductInclude;
}>;

export type ConfigurableProductGroup =
  ConfigurableMenuProduct['product']['productGroups'][number];

export type ConfigurableModifierGroup =
  ConfigurableMenuProduct['product']['modifierGroups'][number];
